"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushStream = void 0;
const __1 = require("../");
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
        /** Flag to stream uses `use` */
        this.useHandler = false;
        /** Array of subscribers for multicast broadcasting */
        this.subscribers = new Set();
        /** Flag to pause the stream */
        this.isPaused = false;
        this.sourceObserver = new __1.RushObserver({ continueOnError: options.continueOnError });
        this.outputObserver = new __1.RushObserver({ continueOnError: options.continueOnError });
        if (options.debugHook)
            this.debugHook = options.debugHook;
        if (options.maxBufferSize && options.maxBufferSize > 0) {
            this.maxBufferSize = options.maxBufferSize;
            this.buffer = [];
        }
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
            this.outputObserver.next(value);
            this.broadcast(value);
        }
        if (this.debugHook)
            (_b = (_a = this.debugHook).onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, value);
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
        var _a, _b;
        if (observer.next)
            this.outputObserver.onNext(observer.next);
        if (observer.error)
            this.outputObserver.onError(observer.error);
        if (observer.complete) {
            this.outputObserver.onComplete(() => {
                observer.complete();
                this.subscribers.forEach((sub) => sub.complete());
            });
        }
        if (!this.useHandler)
            this.sourceObserver.onNext((value) => {
                this.processEvent(value);
            });
        const cleanupFn = this.producer(this.sourceObserver);
        if (typeof cleanupFn === 'function')
            this.cleanup = cleanupFn;
        if (this.debugHook)
            (_b = (_a = this.debugHook).onListen) === null || _b === void 0 ? void 0 : _b.call(_a, observer);
        return this;
    }
    /**
     * Subscribes a multicast subscriber to the stream
     * @param subscribers - Subscribers to add
     */
    subscribe(...subscribers) {
        subscribers.forEach(sub => {
            var _a, _b;
            this.subscribers.add(sub);
            sub.subscribe(this);
            if (this.debugHook)
                (_b = (_a = this.debugHook).onSubscribe) === null || _b === void 0 ? void 0 : _b.call(_a, sub);
        });
        return this;
    }
    /**
     * Unsubscribes a multicast subscriber
     * @param subscriber - The subscriber to remove
    */
    unsubscribe(...subscribers) {
        subscribers.forEach(sub => {
            var _a, _b;
            this.subscribers.delete(sub);
            sub.unsubscribe();
            if (this.debugHook)
                (_b = (_a = this.debugHook).onUnsubscribe) === null || _b === void 0 ? void 0 : _b.call(_a, sub);
        });
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
        const { errorHandler = (error) => { }, } = options;
        if (Array.isArray(args[0])) {
            middlewares = args[0];
            options = args[1] && typeof args[1] === 'object' ? args[1] : {};
        }
        else {
            middlewares = args;
        }
        const errorHandlerWrapper = (error) => {
            var _a, _b;
            errorHandler(error);
            this.outputObserver.error(error);
            if (this.debugHook)
                (_b = (_a = this.debugHook).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
        };
        const { applyMiddleware } = (0, retry_utils_1.createRetryWrapper)(middlewares, options, errorHandlerWrapper);
        const newHandler = (value) => {
            const result = applyMiddleware(value);
            if (result instanceof Promise) {
                result.then((res) => { this.processEvent(res); });
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
        var _a, _b, _c;
        if (option === 'destroy') {
            this.sourceObserver.destroy();
            this.outputObserver.destroy();
            this.subscribers.clear();
            this.buffer = undefined;
            this.useHandler = false;
            this.isPaused = false;
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
        }
        else {
            this.sourceObserver.complete();
            this.outputObserver.complete();
        }
        (_a = this.cleanup) === null || _a === void 0 ? void 0 : _a.call(this);
        if (this.debugHook)
            (_c = (_b = this.debugHook).onUnlisten) === null || _c === void 0 ? void 0 : _c.call(_b, option);
        return this;
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
exports.RushStream = RushStream;
