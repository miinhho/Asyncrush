"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushSubscriber = void 0;
const rush_observer_1 = require("../observer/rush-observer");
const retry_utils_1 = require("../utils/retry-utils");
class RushSubscriber extends rush_observer_1.RushObserver {
    /**
     * Creates a new RushSubscriber instance
     * @param options - Whether to continue on error
     */
    constructor(options = {}) {
        super(options);
        /** Flag to pause the subscriber */
        this.isPaused = false;
        /** Maximum buffer size */
        this.maxBufferSize = null;
        /** Buffer for paused events */
        this.buffer = null;
        if (options.maxBufferSize && options.maxBufferSize > 0) {
            this.maxBufferSize = options.maxBufferSize;
            this.buffer = [];
        }
    }
    /** Emits a value to all chained 'next' handlers */
    next(value) {
        if (this.isPaused && this.buffer) {
            if (this.buffer.length >= this.maxBufferSize) {
                this.buffer.shift();
            }
            this.buffer.push(value);
        }
        else {
            if (this.nextHandler)
                this.nextHandler(value);
        }
    }
    /** Signals an completion to 'complete' handlers */
    onComplete(handler) {
        super.onComplete(handler);
        return this;
    }
    /** Emits an error to 'error' handlers */
    onError(handler) {
        super.onError(handler);
        return this;
    }
    /**
     * Subscribes to a stream
     * @param stream - Stream to subscribe
     */
    subscribe(stream) {
        if (this.stream && this.stream !== stream)
            this.unsubscribe();
        stream.subscribers.add(this);
        this.stream = stream;
        return this;
    }
    /**
     * Applies middleware to transform events with retry logic
     * @param args - Middleware functions
     */
    use(...args) {
        let middlewares = [];
        let options = {};
        const { retries = 0, retryDelay = 0, maxRetryDelay = Infinity, jitter = 0, delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt), errorHandler = (error) => { }, } = options;
        if (Array.isArray(args[0])) {
            middlewares = args[0];
            ``;
            options = args[1] && typeof args[1] === 'object' ? args[1] : {};
        }
        else {
            middlewares = args;
        }
        const errorHandlerWrapper = (error) => {
            errorHandler(error);
            this.error(error);
        };
        const { applyMiddleware } = (0, retry_utils_1.createRetryWrapper)(middlewares, options, errorHandlerWrapper);
        this.onNext((value) => {
            applyMiddleware(value);
        });
        return this;
    }
    /** Unsubscribes from the stream and clear buffer */
    unsubscribe() {
        if (this.buffer)
            this.buffer = [];
        if (this.stream)
            this.stream.unsubscribe(this);
        this.stream = undefined;
        return this;
    }
    /** Pauses the subscriber, buffering events if enabled */
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
    /** Flushes the buffer when resuming */
    flushBuffer() {
        if (!this.buffer || this.isPaused)
            return;
        while (this.buffer.length > 0 && !this.isPaused) {
            try {
                if (this.nextHandler)
                    this.nextHandler(this.buffer.shift());
            }
            catch (err) {
                this.error(err);
                break;
            }
        }
    }
    /** Destroy the subscriber */
    destroy() {
        if (this.buffer)
            this.buffer = [];
        this.unsubscribe();
        super.destroy();
    }
}
exports.RushSubscriber = RushSubscriber;
