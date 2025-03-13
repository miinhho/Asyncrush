"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushSubject = void 0;
const manager_1 = require("../manager");
const rush_stream_1 = require("./rush-stream");
/**
 * Wrapper class to use RushStream without producer
 * @template T - the type of values emitted by the subject
 */
class RushSubject {
    /**
     * Initialize stream which uses backpressure with default options
     */
    constructor() {
        this.stream = new rush_stream_1.RushStream((observer) => {
            this.controller = observer;
        }, {
            backpressure: manager_1.DEFAULT_BACKPRESSURE_OPTIONS,
        }).listen({
            next: () => { },
            error: () => { },
            complete: () => { },
        });
    }
    /**
     * Emits a value to 'next' handlers
     * @param value - The value to emit
     */
    next(value) {
        var _a, _b;
        this.controller.next(value);
        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, value);
    }
    /**
     * Emits an error to 'error' handlers
     * @param error - The error to emit
     */
    error(error) {
        var _a, _b;
        this.controller.error(error);
        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
    }
    /**
     * Signals completion to 'complete' handlers
     */
    complete() {
        this.controller.complete();
    }
    /**
     * Applies middleware to transform events
     * @param handlers - Middleware functions
     */
    use(...handlers) {
        this.stream.use(...handlers);
        return this;
    }
    /**
     * Adds a listener to the stream
     * @param observer - Observer with optional event handlers
     */
    listen(observer) {
        var _a, _b;
        this.stream.listen(observer);
        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onListen) === null || _b === void 0 ? void 0 : _b.call(_a, observer);
        return this;
    }
    /**
     * Stops the stream and clear objects with options
     * @param option - The option to stop the stream (default: `complete`)
     * @returns
     */
    unlisten(option) {
        var _a, _b;
        this.stream.unlisten(option);
        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onUnlisten) === null || _b === void 0 ? void 0 : _b.call(_a, option);
        return this;
    }
    /**
     * Subscribes a multicast subscriber to the stream
     * @param subscribers - Subscribers to add
     */
    subscribe(...subscribers) {
        var _a, _b;
        this.stream.subscribe(...subscribers);
        // Iterate with subscribers if subject uses debugger
        if (this.debugHook) {
            for (const subscriber of subscribers) {
                (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onSubscribe) === null || _b === void 0 ? void 0 : _b.call(_a, subscriber);
            }
        }
        return this;
    }
    /**
     * Unsubscribes a multicast subscriber
     * @param subscribers - The subscribers to remove
     */
    unsubscribe(...subscribers) {
        var _a, _b;
        this.stream.unsubscribe(...subscribers);
        // Iterate with subscribers if subject uses debugger
        if (this.debugHook) {
            for (const subscriber of subscribers) {
                (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onUnsubscribe) === null || _b === void 0 ? void 0 : _b.call(_a, subscriber);
            }
        }
        return this;
    }
    /**
     * Set the debounce time in milliseconds
     * @param ms - Milliseconds to debounce
     */
    debounce(ms) {
        this.stream.debounce(ms);
        return this;
    }
    /**
     * Set the throttle time in milliseconds
     * @param ms - Milliseconds to throttle
     */
    throttle(ms) {
        this.stream.throttle(ms);
        return this;
    }
    /**
     * Gets the underlying backpressure controller
     */
    getBackpressureController() {
        return this.stream.getBackpressureController();
    }
    /**
     * Sets the backpressure mode dynamically
     * @param mode The backpressure mode to use
     */
    setBackpressureMode(mode) {
        var _a;
        (_a = this.stream.getBackpressureController()) === null || _a === void 0 ? void 0 : _a.setMode(mode);
        return this;
    }
    /**
     * Adjusts the backpressure watermark levels
     * @param highWatermark Maximum buffer size
     * @param lowWatermark Buffer level to resume normal flow
     */
    setBackpressureWatermarks(highWatermark, lowWatermark) {
        var _a;
        (_a = this.stream
            .getBackpressureController()) === null || _a === void 0 ? void 0 : _a.setWatermarks(highWatermark, lowWatermark);
        return this;
    }
    /**
     * Pauses the stream, buffering events if enabled
     */
    pause() {
        this.stream.pause();
        return this;
    }
    /**
     * Resumes the stream, flushing buffered events
     */
    resume() {
        this.stream.resume();
        return this;
    }
    /**
     * Register debugger for stream
     * @param debugHook - Debugging hooks
     */
    debug(debugHook) {
        this.debugHook = debugHook;
        return this;
    }
}
exports.RushSubject = RushSubject;
