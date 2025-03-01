"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushStream = void 0;
const rush_observer_1 = require("../observer/rush-observer");
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
        /** Handler for connect source & output observer */
        this.useHandler = null;
        /** Error handler for middleware */
        this.errorHandler = null;
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
        this.lastValue = null;
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
        if (options.maxBufferSize) {
            this.maxBufferSize = options.maxBufferSize;
            this.buffer = [];
        }
    }
    /** Processes an event with debounce or throttle control */
    processEvent(value) {
        if (this.debounceMs !== null) {
            this.lastValue = value;
            if (this.debounceTimeout)
                clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                if (this.lastValue !== null) {
                    this.emit(this.lastValue);
                    this.lastValue = null;
                }
                this.debounceTimeout = null;
            }, this.debounceMs);
        }
        else if (this.throttleMs !== null) {
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
        if (this.isPaused && this.maxBufferSize) {
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
        while (this.buffer.length > 0 && !this.isPaused && this.maxBufferSize) {
            try {
                this.processEvent(this.buffer.shift());
            }
            catch (err) {
                if (this.errorHandler)
                    this.errorHandler(err);
                this.outputObserver.error(err);
            }
        }
        return this;
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
        this.sourceObserver.onNext((value) => {
            this.useHandler ? this.useHandler(value) : this.processEvent(value);
        });
        const cleanupFn = this.producer(this.sourceObserver);
        this.cleanup = cleanupFn !== null && cleanupFn !== void 0 ? cleanupFn : (() => { });
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
    unsubscribe(...subscriber) {
        for (const sub of subscriber) {
            this.subscribers.delete(sub);
        }
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
        const { applyMiddleware, errorHandler } = this.retryWrapper(...args);
        this.errorHandler = errorHandler;
        this.useHandler = (value) => {
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
        return this;
    }
    /** Stops the stream and emits an event */
    unlisten(option) {
        switch (option) {
            case 'destroy': {
                this.sourceObserver.destroy();
                this.outputObserver.destroy();
                this.subscribers.clear();
                this.buffer = [];
                this.useHandler = null;
                this.debounceMs = null;
                this.throttleMs = null;
                this.debounceTimeout && clearTimeout(this.debounceTimeout);
                this.throttleTimeout && clearTimeout(this.throttleTimeout);
                break;
            }
            case 'complete':
            default: {
                this.sourceObserver.complete();
                this.outputObserver.complete();
                break;
            }
        }
        this.cleanup();
        return this;
    }
    /**
     * Helper method to wrap middleware with retry logic
     * @param args - Middleware functions or array with options
    */
    retryWrapper(...args) {
        let middlewares = [];
        let options = {};
        if (Array.isArray(args[0])) {
            middlewares = args[0];
            options = args[1] && typeof args[1] === 'object' ? args[1] : {};
        }
        else {
            middlewares = args;
        }
        const { errorHandler = null, retries = 0, retryDelay = 0, maxRetryDelay = Infinity, jitter = 0, delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt), } = options;
        const scheduleRetry = (attempt, value) => {
            let delay = delayFn(attempt, retryDelay);
            if (jitter > 0) {
                const jitterFactor = 1 + jitter * (Math.random() * 2 - 1);
                delay *= jitterFactor;
            }
            delay = Math.min(delay, maxRetryDelay);
            return new Promise((resolve) => setTimeout(() => resolve(applyMiddleware(value, attempt + 1)), delay));
        };
        const applyMiddleware = (value, attempt = 0) => {
            let result = value;
            for (const middleware of middlewares) {
                if (result instanceof Promise) {
                    result = result.then((value) => {
                        try {
                            return middleware(value);
                        }
                        catch (error) {
                            if (attempt < retries) {
                                return scheduleRetry(attempt, value);
                            }
                            if (errorHandler)
                                errorHandler(error);
                            this.outputObserver.error(error);
                            return value;
                        }
                    });
                }
                else {
                    try {
                        result = middleware(result);
                    }
                    catch (error) {
                        if (attempt < retries) {
                            return scheduleRetry(attempt, value);
                        }
                        if (errorHandler)
                            errorHandler(error);
                        this.outputObserver.error(error);
                        return value;
                    }
                }
            }
            return result;
        };
        return { applyMiddleware, errorHandler };
    }
    /** Set the debounce time in milliseconds  */
    debounce(ms) {
        if (this.throttleMs !== null) {
            console.warn('Debounce overrides existing throttle setting');
            this.throttleMs = null;
            this.throttleTimeout && clearTimeout(this.throttleTimeout);
        }
        this.debounceMs = ms;
        return this;
    }
    /** Set the throttle time in milliseconds  */
    throttle(ms) {
        if (this.debounceMs !== null) {
            console.warn('Throttle overrides existing debounce setting');
            this.debounceMs = null;
            this.debounceTimeout && clearTimeout(this.debounceTimeout);
        }
        this.throttleMs = ms;
        return this;
    }
}
exports.RushStream = RushStream;
