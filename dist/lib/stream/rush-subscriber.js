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
    /** Processes an event with debounce or throttle control */
    processEvent(value) {
        if (this.debounceMs && this.debounceMs > 0) {
            this.debounceTemp = value;
            if (this.debounceTimeout)
                clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                if (this.debounceTemp) {
                    this.emit(this.debounceTemp);
                    this.debounceTemp = undefined;
                }
                this.debounceTimeout = undefined;
            }, this.debounceMs);
        }
        else if (this.throttleMs && this.throttleMs > 0) {
            if (!this.throttleTimeout) {
                this.emit(value);
                this.throttleTimeout = setTimeout(() => {
                    this.throttleTimeout = undefined;
                }, this.throttleMs);
            }
        }
        else {
            this.emit(value);
        }
    }
    /** Emits an event to the output observer and broadcasts to subscribers */
    emit(value) {
        var _a, _b;
        if (this.isPaused && this.buffer) {
            if (this.buffer.length >= this.maxBufferSize) {
                this.buffer.shift();
            }
            this.buffer.push(value);
        }
        else {
            this.nextHandler(value);
            if (this.debugHook)
                (_b = (_a = this.debugHook).onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, value);
        }
    }
    /** Emits a value to all chained 'next' handlers */
    next(value) {
        if (this.nextHandler)
            this.processEvent(value);
    }
    /** Signals an completion to 'complete' handlers */
    complete() {
        var _a, _b;
        if (this.debugHook)
            (_b = (_a = this.debugHook).onUnlisten) === null || _b === void 0 ? void 0 : _b.call(_a, 'complete');
        super.complete();
    }
    /**
     * Adds a handlers for 'next' events, chaining with existing handlers
     * @param handlers - The handlers to add
     */
    onNext(handler) {
        super.onNext(handler);
        return this;
    }
    /** Add a handler for 'complete' events */
    onComplete(handler) {
        super.onComplete(handler);
        return this;
    }
    /** Add a handler for 'error' events */
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
            this.processEvent(this.buffer.shift());
        }
    }
    /** Destroy the subscriber */
    destroy() {
        var _a, _b;
        this.unsubscribe();
        super.destroy();
        if (this.buffer)
            this.buffer = undefined;
        this.debounceTemp = undefined;
        this.debounceMs = undefined;
        this.throttleMs = undefined;
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = undefined;
        }
        if (this.throttleTimeout) {
            clearTimeout(this.throttleTimeout);
            this.throttleTimeout = undefined;
        }
        if (this.debugHook)
            (_b = (_a = this.debugHook).onUnlisten) === null || _b === void 0 ? void 0 : _b.call(_a, 'destroy');
    }
    /** Set the debounce time in milliseconds  */
    debounce(ms) {
        if (this.throttleMs) {
            console.warn('[Asyncrush] - Debounce overrides existing throttle setting');
            this.throttleMs = undefined;
            if (this.throttleTimeout) {
                clearTimeout(this.throttleTimeout);
                this.throttleTimeout = undefined;
            }
        }
        this.debounceMs = ms;
        return this;
    }
    /** Set the throttle time in milliseconds  */
    throttle(ms) {
        if (this.debounceMs) {
            console.warn('[Asyncrush] - Throttle overrides existing debounce setting');
            this.debounceMs = undefined;
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
                this.debounceTimeout = undefined;
            }
        }
        this.throttleMs = ms;
        return this;
    }
}
exports.RushSubscriber = RushSubscriber;
