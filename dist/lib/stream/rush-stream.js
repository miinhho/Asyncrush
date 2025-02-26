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
        var _a, _b;
        this.producer = producer;
        /** Source observer receiving events from the producer */
        this.sourceObserver = new rush_observer_1.RushObserver();
        /** Output observer distributing events to listeners and subscribers */
        this.outputObserver = new rush_observer_1.RushObserver();
        /** Handler for connect source & output observer */
        this.useHandler = null;
        /** Array of subscribers for multicast broadcasting */
        this.subscribers = [];
        /** Cleanup function returned by the producer */
        this.cleanup = () => { };
        /** Flag to enable error continuation */
        this.continueOnError = false;
        /** Flag to pause the stream */
        this.isPaused = false;
        /** Flag to enable buffering when paused */
        this.useBuffer = false;
        /** Buffer to store events when paused */
        this.buffer = [];
        /** Maximum size of the buffer */
        this.maxBufferSize = 0;
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
        this.continueOnError = (_a = options.continueOnError) !== null && _a !== void 0 ? _a : false;
        this.sourceObserver = new rush_observer_1.RushObserver({ continueOnError: options.continueOnError });
        this.outputObserver = new rush_observer_1.RushObserver({ continueOnError: options.continueOnError });
        if (options.useBuffer) {
            this.useBuffer = true;
            this.maxBufferSize = (_b = options.maxBufferSize) !== null && _b !== void 0 ? _b : 1000;
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
        if (this.isPaused && this.useBuffer) {
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
        while (this.buffer.length > 0 && !this.isPaused && this.useBuffer) {
            this.processEvent(this.buffer.shift());
        }
        return this;
    }
    /**
     * Adds a listener to the stream with traditional observer pattern
     * @param observer - Observer with optional event handlers
     */
    listen(observer) {
        if (observer.next)
            this.outputObserver.on('next', observer.next);
        if (observer.error)
            this.outputObserver.on('error', observer.error);
        if (observer.complete)
            this.outputObserver.on('complete', observer.complete);
        this.sourceObserver.on('next', (value) => {
            this.useHandler ? this.useHandler(value) : this.processEvent(value);
        });
        const cleanupFn = this.producer(this.sourceObserver);
        this.cleanup = cleanupFn !== null && cleanupFn !== void 0 ? cleanupFn : (() => { });
        return this;
    }
    /**
     * Subscribes a new observer for multicast events
     * @returns New RushObserver instance for the subscriber
     */
    subscribe() {
        const sub = new rush_observer_1.RushObserver({ continueOnError: this.continueOnError });
        this.subscribers.push(sub);
        if (this.useBuffer && !this.isPaused) {
            this.buffer.forEach(value => sub.next(value));
        }
        return sub;
    }
    /** Unsubscribes a multicast subscriber */
    unsubscribe(subscriber) {
        this.subscribers = this.subscribers.filter(sub => sub !== subscriber);
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
        const { withRetry, options } = this.retryWrapper(...args);
        const { errorHandler, continueOnError } = options;
        this.useHandler = (value) => {
            const result = withRetry(value);
            if (result instanceof Promise) {
                result.then((res) => {
                    this.processEvent(res);
                }, (err) => {
                    if (errorHandler)
                        errorHandler(err);
                    if (!continueOnError)
                        this.outputObserver.error(err);
                });
            }
            else {
                try {
                    this.processEvent(result);
                }
                catch (err) {
                    if (errorHandler)
                        errorHandler(err);
                    if (!continueOnError)
                        this.outputObserver.error(err);
                }
            }
        };
        return this;
    }
    /** Helper method to wrap middleware with retry logic */
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
        const { errorHandler, retries = 0, retryDelay = 0, maxRetryDelay = Infinity, jitter = 0, delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt), continueOnError = false } = options;
        const applyMiddleware = (value) => {
            let result = value;
            for (const middleware of middlewares) {
                if (result instanceof Promise) {
                    result = result.then((value) => middleware(value));
                }
                else {
                    result = middleware(result);
                }
            }
            return result;
        };
        const scheduleRetry = (attempt, value) => {
            let delay = delayFn(attempt, retryDelay);
            if (jitter > 0) {
                const jitterFactor = 1 + jitter * (Math.random() * 2 - 1);
                delay *= jitterFactor;
            }
            delay = Math.min(delay, maxRetryDelay);
            return new Promise((resolve) => setTimeout(() => resolve(withRetry(value, attempt + 1)), delay));
        };
        const withRetry = (value, attempt = 0) => {
            if (retries === 0)
                return applyMiddleware(value);
            const result = applyMiddleware(value);
            if (result instanceof Promise) {
                return result.catch((error) => {
                    if (attempt < retries) {
                        return scheduleRetry(attempt, value);
                    }
                    throw error;
                });
            }
            try {
                return result;
            }
            catch (error) {
                if (attempt < retries) {
                    return scheduleRetry(attempt, value);
                }
                throw error;
            }
        };
        return { withRetry, options };
    }
    /** Stops the stream and emits an event */
    unlisten(option) {
        switch (option) {
            case 'destroy': {
                this.sourceObserver.destroy();
                this.outputObserver.destroy();
                break;
            }
            case 'complete':
            default:
                this.outputObserver.complete();
                break;
        }
        this.cleanup();
        return this;
    }
    /** Set the debounce time in milliseconds  */
    debounce(ms) {
        this.debounceMs = ms;
        return this;
    }
    /** Set the throttle time in milliseconds  */
    throttle(ms) {
        this.throttleMs = ms;
        return this;
    }
}
exports.RushStream = RushStream;
//# sourceMappingURL=rush-stream.js.map