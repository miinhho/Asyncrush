"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushSubscriber = void 0;
const __1 = require("../");
const retry_utils_1 = require("../utils/retry-utils");
class RushSubscriber extends __1.RushObserver {
    /**
     * Creates a new RushSubscriber instance
     * @param options - Whether to continue on error
     */
    constructor(options = {}) {
        super(options);
        /** Flag to pause the subscriber */
        this.isPaused = false;
        if (options.maxBufferSize && options.maxBufferSize > 0) {
            this.maxBufferSize = options.maxBufferSize;
            this.buffer = [];
        }
        if (options.debugHook)
            this.debugHook = options.debugHook;
    }
    /** Emits a value to all chained 'next' handlers */
    next(value) {
        var _a, _b;
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
        if (this.debugHook)
            (_b = (_a = this.debugHook).onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, value);
    }
    /** Signals an completion to 'complete' handlers */
    onComplete(handler) {
        var _a, _b;
        super.onComplete(handler);
        if (this.debugHook)
            (_b = (_a = this.debugHook).onUnlisten) === null || _b === void 0 ? void 0 : _b.call(_a, 'complete');
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
        var _a, _b;
        if (this.stream && this.stream !== stream)
            this.unsubscribe();
        stream.subscribers.add(this);
        this.stream = stream;
        if (this.debugHook)
            (_b = (_a = this.debugHook).onSubscribe) === null || _b === void 0 ? void 0 : _b.call(_a, this);
        return this;
    }
    /**
     * Applies middleware to transform events with retry logic
     * @param args - Middleware functions
     */
    use(...args) {
        let middlewares = [];
        let options = {};
        const { errorHandler = (error) => { }, } = options;
        if (Array.isArray(args[0])) {
            middlewares = args[0];
            ``;
            options = args[1] && typeof args[1] === 'object' ? args[1] : {};
        }
        else {
            middlewares = args;
        }
        const errorHandlerWrapper = (error) => {
            var _a, _b;
            errorHandler(error);
            this.error(error);
            if (this.debugHook)
                (_b = (_a = this.debugHook).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
        };
        const { applyMiddleware } = (0, retry_utils_1.createRetryWrapper)(middlewares, options, errorHandlerWrapper);
        this.onNext((value) => {
            applyMiddleware(value);
        });
        return this;
    }
    /** Unsubscribes from the stream and clear buffer */
    unsubscribe() {
        var _a, _b, _c;
        if (this.buffer)
            this.buffer = [];
        if ((_a = this.stream) === null || _a === void 0 ? void 0 : _a.subscribers.has(this))
            this.stream.unsubscribe(this);
        this.stream = undefined;
        if (this.debugHook)
            (_c = (_b = this.debugHook).onUnsubscribe) === null || _c === void 0 ? void 0 : _c.call(_b, this);
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
        var _a, _b;
        if (this.buffer)
            this.buffer = undefined;
        this.unsubscribe();
        super.destroy();
        if (this.debugHook)
            (_b = (_a = this.debugHook).onUnlisten) === null || _b === void 0 ? void 0 : _b.call(_a, 'destroy');
    }
}
exports.RushSubscriber = RushSubscriber;
