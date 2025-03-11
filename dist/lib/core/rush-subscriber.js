"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushSubscriber = void 0;
const manager_1 = require("../manager");
const retry_1 = require("./retry");
const rush_observer_1 = require("./rush-observer");
/**
 * Optimized subscriber for RushStream with enhanced memory management and processing
 * @template T Type of values handled by the subscriber
 */
class RushSubscriber extends rush_observer_1.RushObserver {
    /**
     * Creates a new optimized RushSubscriber instance
     * @param options Configuration options including optimizations
     */
    constructor(options = {}) {
        super(options);
        /** Flag to pause the subscriber */
        this.isPaused = false;
        /** Time control configuration */
        this.timeControl = {};
        if (options.backpressure) {
            this.backpressure = new manager_1.BackpressureController(options.backpressure);
            this.backpressure.onPause(() => {
                var _a, _b;
                this.isPaused = true;
                (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, { type: 'backpressure:pause' });
            });
            this.backpressure.onResume(() => {
                var _a, _b;
                this.isPaused = false;
                (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, { type: 'backpressure:resume' });
            });
            this.backpressure.onDrop((value) => {
                var _a, _b;
                (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, { type: 'backpressure:drop', value });
            });
        }
        if (options.debugHook) {
            this.debugHook = options.debugHook;
        }
    }
    /**
     * Processes an event with debounce or throttle control
     * @param value The value to process
     */
    processEvent(value) {
        if (!this.isActive)
            return;
        const { type, ms, timeout } = this.timeControl;
        if (!type || !ms) {
            this.emit(value);
            return;
        }
        if (type === 'debounce') {
            this.timeControl.temp = value;
            if (timeout)
                clearTimeout(timeout);
            this.timeControl.timeout = setTimeout(() => {
                if (this.timeControl.temp !== undefined) {
                    this.emit(this.timeControl.temp);
                    this.timeControl.temp = undefined;
                }
                this.timeControl.timeout = undefined;
            }, ms);
        }
        else if (type === 'throttle' && !timeout) {
            this.emit(value);
            this.timeControl.timeout = setTimeout(() => {
                this.timeControl.timeout = undefined;
            }, ms);
        }
    }
    /**
     * Emits an event to the output observer with backpressure control
     * @param value The value to emit
     */
    emit(value) {
        var _a, _b;
        if (!this.isActive)
            return;
        if (this.isPaused) {
            if (this.backpressure) {
                const result = this.backpressure.push(value);
                if (result.accepted) {
                    if (this.nextHandler) {
                        this.nextHandler(result.value);
                    }
                }
                else if (result.waitPromise) {
                    result.waitPromise
                        .then(() => {
                        if (this.nextHandler && !this.isActive) {
                            this.nextHandler(value);
                        }
                    })
                        .catch((err) => {
                        if (!this.isActive) {
                            this.error(err);
                        }
                    });
                }
            }
        }
        else if (this.nextHandler) {
            this.nextHandler(value);
            (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, value);
        }
    }
    /**
     * Emits a value to all chained 'next' handlers
     * @param value The value to emit
     */
    next(value) {
        if (!this.isActive || !this.nextHandler)
            return;
        this.processEvent(value);
    }
    /**
     * Signals an error to 'error' handlers
     * @param err The error to emit
     */
    error(err) {
        var _a, _b;
        if (!this.isActive)
            return;
        super.error(err);
        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onError) === null || _b === void 0 ? void 0 : _b.call(_a, err);
    }
    /**
     * Signals completion to 'complete' handlers
     */
    complete() {
        var _a, _b;
        if (!this.isActive)
            return;
        super.complete();
        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onUnlisten) === null || _b === void 0 ? void 0 : _b.call(_a, 'complete');
    }
    /**
     * Adds a handler for 'next' events
     * @param handler The handler to add
     */
    onNext(handler) {
        if (!this.isActive)
            return this;
        super.onNext(handler);
        return this;
    }
    /**
     * Add a handler for 'complete' events
     * @param handler The handler to add
     */
    onComplete(handler) {
        if (!this.isActive)
            return this;
        super.onComplete(handler);
        return this;
    }
    /**
     * Add a handler for 'error' events
     * @param handler The handler to add
     */
    onError(handler) {
        if (!this.isActive)
            return this;
        super.onError(handler);
        return this;
    }
    /**
     * Subscribe to a multicast stream
     * @param stream Stream to subscribe to
     */
    subscribe(stream) {
        var _a, _b;
        if (!this.isActive)
            return this;
        if (this.stream && this.stream !== stream) {
            this.unsubscribe();
        }
        stream.subscribe(this);
        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onSubscribe) === null || _b === void 0 ? void 0 : _b.call(_a, this);
        return this;
    }
    /**
     * Unsubscribes from the stream
     */
    unsubscribe() {
        var _a, _b;
        if (!this.isActive)
            return this;
        if (this.stream) {
            this.stream.unsubscribe(this);
        }
        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onUnsubscribe) === null || _b === void 0 ? void 0 : _b.call(_a, this);
        return this;
    }
    /**
     * Applies middleware to transform events with retry logic
     * @param args Middleware functions or array with options
     */
    use(...args) {
        if (!this.isActive)
            return this;
        let middlewares = [];
        let options = {};
        if (Array.isArray(args[0])) {
            middlewares = args[0];
            options = args[1] && typeof args[1] === 'object' ? args[1] : {};
        }
        else {
            middlewares = args;
        }
        if (middlewares.length === 0)
            return this;
        const errorHandlerWrapper = (error) => {
            var _a, _b, _c;
            (_a = options.errorHandler) === null || _a === void 0 ? void 0 : _a.call(options, error);
            this.error(error);
            (_c = (_b = this.debugHook) === null || _b === void 0 ? void 0 : _b.onError) === null || _c === void 0 ? void 0 : _c.call(_b, error);
        };
        const { applyMiddleware } = (0, retry_1.createRetryWrapper)(middlewares, options, errorHandlerWrapper);
        this.onNext((value) => {
            try {
                const result = applyMiddleware(value);
                if (result instanceof Promise) {
                    result.catch(errorHandlerWrapper);
                }
            }
            catch (err) {
                errorHandlerWrapper(err);
            }
        });
        return this;
    }
    /**
     * Pauses the subscriber, buffering events if enabled
     */
    pause() {
        if (!this.isActive)
            return this;
        this.isPaused = true;
        return this;
    }
    /**
     * Resumes the subscriber, flushing buffered events
     */
    resume() {
        if (!this.isActive)
            return this;
        this.isPaused = false;
        return this;
    }
    /**
     * Destroys the subscriber
     */
    destroy() {
        var _a, _b;
        if (!this.isActive)
            return;
        this.isActive = true;
        this.unsubscribe();
        super.destroy();
        this.clearTimeControl();
        if (this.backpressure)
            this.backpressure.clear();
        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onUnlisten) === null || _b === void 0 ? void 0 : _b.call(_a, 'destroy');
    }
    /**
     * Set the debounce time in milliseconds
     */
    debounce(ms) {
        if (!this.isActive)
            return this;
        this.clearTimeControl();
        this.timeControl = {
            type: 'debounce',
            ms,
        };
        return this;
    }
    /**
     * Set the throttle time in milliseconds
     */
    throttle(ms) {
        if (!this.isActive)
            return this;
        this.clearTimeControl();
        this.timeControl = {
            type: 'throttle',
            ms,
        };
        return this;
    }
    /**
     * Clear time control settings and timers
     */
    clearTimeControl() {
        if (this.timeControl.timeout) {
            clearTimeout(this.timeControl.timeout);
        }
        this.timeControl = {};
    }
    /**
     * Gets the underlying backpressure controller
     */
    getBackpressureController() {
        return this.backpressure;
    }
    /**
     * Sets the backpressure mode dynamically
     * @param mode The backpressure mode to use
     */
    setBackpressureMode(mode) {
        if (this.backpressure) {
            this.backpressure.setMode(mode);
        }
        return this;
    }
    /**
     * Adjusts the backpressure watermark levels
     * @param highWatermark Maximum buffer size
     * @param lowWatermark Buffer level to resume normal flow
     */
    setBackpressureWatermarks(highWatermark, lowWatermark) {
        if (this.backpressure) {
            this.backpressure.setWatermarks(highWatermark, lowWatermark);
        }
        return this;
    }
}
exports.RushSubscriber = RushSubscriber;
