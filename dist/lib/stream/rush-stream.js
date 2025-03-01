"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushStream = void 0;
const rush_observer_1 = require("../observer/rush-observer");
const retry_utils_1 = require("../utils/retry-utils");
/**
 * Stream that emits values, errors, and completion events with multicast and backpressure support
 * @template T - The type of values emitted by the stream
 */
class RushStream {
    /**
     * Creates a new RushStream instance
     * @param producer - Function that emits events to the source observer and returns a cleanup function
     * @param options - Configuration options for buffering and error handling
     */
    constructor(producer, options = {}) {
        this.producer = producer;
        /** Source observer receiving events from the producer */
        this.sourceObserver = new rush_observer_1.RushObserver();
        /** Output observer distributing events to listeners and subscribers */
        this.outputObserver = new rush_observer_1.RushObserver();
        /** Flag to stream uses `use` */
        this.useHandler = false;
        /** Array of subscribers for multicast broadcasting */
        this.subscribers = new Set();
        /** Cleanup function returned by the producer */
        this.cleanup = () => { };
        /** Flag to pause the stream */
        this.isPaused = false;
        /** Buffer to store events when paused */
        this.buffer = null;
        /** Maximum size of the buffer, null disables buffering */
        this.maxBufferSize = null;
        /** Last value for debounce */
        this.debounceTemp = null;
        /** Debounce time in milliseconds */
        this.debounceMs = null;
        /** Timeout for debounce control */
        this.debounceTimeout = null;
        /** Throttle time in milliseconds */
        this.throttleMs = null;
        /** Timeout for throttle control */
        this.throttleTimeout = null;
        this.sourceObserver = new rush_observer_1.RushObserver({ continueOnError: options.continueOnError });
        this.outputObserver = new rush_observer_1.RushObserver({ continueOnError: options.continueOnError });
        if (options.maxBufferSize && options.maxBufferSize > 0) {
            this.maxBufferSize = options.maxBufferSize;
            this.buffer = [];
        }
    }
    /** Processes an event with debounce or throttle control */
    processEvent(value) {
        if (this.debounceMs !== null && this.debounceMs > 0) {
            this.debounceTemp = value;
            if (this.debounceTimeout)
                clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                if (this.debounceTemp !== null) {
                    this.emit(this.debounceTemp);
                    this.debounceTemp = null;
                }
                this.debounceTimeout = null;
            }, this.debounceMs);
        }
        else if (this.throttleMs !== null && this.throttleMs > 0) {
            if (!this.throttleTimeout) {
                this.emit(value);
                this.throttleTimeout = setTimeout(() => {
                    this.throttleTimeout = null;
                }, this.throttleMs);
            }
        }
        else {
            this.emit(value);
        }
    }
    /** Emits an event to the output observer and broadcasts to subscribers */
    emit(value) {
        if (this.isPaused && this.buffer) {
            if (this.buffer.length >= this.maxBufferSize) {
                this.buffer.shift();
            }
            this.buffer.push(value);
        }
        else {
            this.outputObserver.next(value);
            this.broadcast(value);
        }
    }
    /** Pauses the stream, buffering events if enabled */
    pause() {
        this.isPaused = true;
        return this;
    }
    /** Resumes the stream, flushing buffered events */
    resume() {
        this.isPaused = false;
        this.flushBuffer();
        return this;
    }
    /** Flushes the buffer to emit all stored events */
    flushBuffer() {
        if (!this.buffer || this.isPaused)
            return;
        while (this.buffer.length > 0 && !this.isPaused) {
            this.processEvent(this.buffer.shift());
        }
    }
    /**
     * Adds a listener to the stream with traditional observer pattern
     * @param observer - Observer with optional event handlers
     */
    listen(observer) {
        if (observer.next)
            this.outputObserver.onNext(observer.next);
        if (observer.error)
            this.outputObserver.onError(observer.error);
        if (observer.complete)
            this.outputObserver.onComplete(() => {
                observer.complete();
                this.subscribers.forEach((sub) => sub.complete());
            });
        if (!this.useHandler)
            this.sourceObserver.onNext((value) => {
                this.processEvent(value);
            });
        const cleanupFn = this.producer(this.sourceObserver);
        if (typeof cleanupFn === 'function') {
            this.cleanup = cleanupFn;
        }
        return this;
    }
    /**
     * Subscribes a multicast subscriber to the stream
     * @param subscribers - Subscribers to add
     */
    subscribe(...subscribers) {
        subscribers.forEach(sub => {
            this.subscribers.add(sub);
            sub.subscribe(this);
        });
        return this;
    }
    /**
     * Unsubscribes a multicast subscriber
     * @param subscriber - The subscriber to remove
    */
    unsubscribe(...subscribers) {
        subscribers.forEach(sub => this.subscribers.delete(sub));
        return this;
    }
    /** Broadcasts an event to all multicast subscribers */
    broadcast(value) {
        this.subscribers.forEach(sub => sub.next(value));
    }
    /**
     * Applies middleware to transform events with retry logic
     * @param args - Middleware functions or array with options
     */
    use(...args) {
        let middlewares = [];
        let options = {};
        const { retries = 0, retryDelay = 0, maxRetryDelay = Infinity, jitter = 0, delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt), errorHandler = (error) => { }, } = options;
        if (Array.isArray(args[0])) {
            middlewares = args[0];
            options = args[1] && typeof args[1] === 'object' ? args[1] : {};
        }
        else {
            middlewares = args;
        }
        const errorHandlerWrapper = (error) => {
            errorHandler(error);
            this.outputObserver.error(error);
        };
        const { applyMiddleware } = (0, retry_utils_1.createRetryWrapper)(middlewares, options, errorHandlerWrapper);
        const newHandler = (value) => {
            const result = applyMiddleware(value);
            if (result instanceof Promise) {
                result.then((res) => {
                    this.processEvent(res);
                });
            }
            else {
                this.processEvent(result);
            }
        };
        this.sourceObserver.onNext(newHandler);
        this.useHandler = true;
        return this;
    }
    /** Stops the stream and emits an event */
    unlisten(option) {
        if (option === 'destroy') {
            this.sourceObserver.destroy();
            this.outputObserver.destroy();
            this.subscribers.clear();
            if (this.buffer)
                this.buffer = [];
            this.useHandler = false;
            this.isPaused = false;
            this.debounceTemp = null;
            this.debounceMs = null;
            this.throttleMs = null;
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
                this.debounceTimeout = null;
            }
            if (this.throttleTimeout) {
                clearTimeout(this.throttleTimeout);
                this.throttleTimeout = null;
            }
        }
        else {
            this.sourceObserver.complete();
            this.outputObserver.complete();
        }
        if (typeof this.cleanup === 'function') {
            this.cleanup();
        }
        return this;
    }
    /** Set the debounce time in milliseconds  */
    debounce(ms) {
        if (this.throttleMs !== null) {
            console.warn('[Asyncrush] - Debounce overrides existing throttle setting');
            this.throttleMs = null;
            if (this.throttleTimeout) {
                clearTimeout(this.throttleTimeout);
                this.throttleTimeout = null;
            }
        }
        this.debounceMs = ms;
        return this;
    }
    /** Set the throttle time in milliseconds  */
    throttle(ms) {
        if (this.debounceMs !== null) {
            console.warn('[Asyncrush] - Throttle overrides existing debounce setting');
            this.debounceMs = null;
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
                this.debounceTimeout = null;
            }
        }
        this.throttleMs = ms;
        return this;
    }
}
exports.RushStream = RushStream;
