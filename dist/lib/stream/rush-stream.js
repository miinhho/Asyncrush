"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushStream = void 0;
const rush_observer_1 = require("../observer/rush-observer");
/**
 * Stream that emits values, errors, and completion events
 */
class RushStream {
    /**
     * @param producer - A function that takes an RushObserver and returns a cleanup function
     */
    constructor(producer, options = {}) {
        var _a;
        this.producer = producer;
        this.sourceObserver = new rush_observer_1.RushObserver();
        this.outputObserver = new rush_observer_1.RushObserver();
        this.cleanup = () => { };
        this.isPaused = false;
        this.useBuffer = false;
        this.buffer = [];
        this.maxBufferSize = 0;
        this.sourceObserver = new rush_observer_1.RushObserver({ continueOnError: options.continueOnError });
        this.outputObserver = new rush_observer_1.RushObserver({ continueOnError: options.continueOnError });
        if (options.useBuffer) {
            this.useBuffer = true;
            this.maxBufferSize = (_a = options.maxBufferSize) !== null && _a !== void 0 ? _a : 1000;
            this.buffer = new Array(this.maxBufferSize);
        }
        const cleanupFn = this.producer(this.sourceObserver);
        this.cleanup = cleanupFn !== null && cleanupFn !== void 0 ? cleanupFn : (() => { });
    }
    /**
     * Pauses the stream, buffering values if resumed
     * @returns The RushStream instance for chaining
     */
    pause() {
        this.isPaused = true;
        return this;
    }
    /**
     * Resumes the stream, flushing buffered values
     * @returns The RushStream instance for chaining
     */
    resume() {
        this.isPaused = false;
        while (this.buffer.length > 0 && !this.isPaused && this.useBuffer) {
            this.outputObserver.next(this.buffer.shift());
        }
        return this;
    }
    /**
     * Subscribes an observer to the stream
     * @param observer - Partial observer implementation with event handlers
     * @returns - The RushStream instance for chaining
     */
    listen(observer) {
        if (observer.next) {
            this.outputObserver.on('next', (value) => {
                if (this.isPaused && this.maxBufferSize > 0 && this.useBuffer) {
                    if (this.buffer.length < this.maxBufferSize) {
                        this.buffer.push(value);
                    }
                    return;
                }
                observer.next(value);
            });
        }
        if (observer.error)
            this.outputObserver.on('error', observer.error);
        if (observer.complete)
            this.outputObserver.on('complete', observer.complete);
        return this;
    }
    use(...args) {
        let middlewares = [];
        let options = {};
        if (Array.isArray(args[0])) {
            middlewares = args[0];
            options = (args[1] && typeof args[1] === 'object') ? args[1] : {};
        }
        else {
            middlewares = args;
        }
        const { errorHandler, retries = 0, retryDelay = 0, maxRetryDelay = Infinity, jitter = 0, delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt), continueOnError = false, } = options;
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
        this.sourceObserver.on('next', (value) => {
            const result = withRetry(value);
            if (result instanceof Promise) {
                result.then((res) => this.outputObserver.next(res), (err) => {
                    if (errorHandler)
                        errorHandler(err);
                    if (!continueOnError)
                        this.outputObserver.error(err);
                });
            }
            else {
                try {
                    this.outputObserver.next(result);
                }
                catch (err) {
                    if (errorHandler)
                        errorHandler(err);
                    if (!continueOnError)
                        this.outputObserver.error(err);
                }
            }
        });
        return this;
    }
    /**
     * Get the stream's observer instance
     * @returns The RushObserver instance
     */
    getObserver() {
        return this.sourceObserver;
    }
    /**
     * Unsubscribes from the stream and emits specified event
     * @param option - Specific event to emit when unsubscribing
     * @returns {this} - The RushStream instance for chaining
     */
    unlisten(option) {
        switch (option) {
            case 'destory': {
                this.outputObserver.destroy();
                break;
            }
            case 'complete':
            default: {
                this.outputObserver.complete();
                break;
            }
        }
        this.cleanup();
        return this;
    }
}
exports.RushStream = RushStream;
//# sourceMappingURL=rush-stream.js.map