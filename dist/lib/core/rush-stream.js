"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushStream = void 0;
const manager_1 = require("../manager");
const retry_1 = require("./retry");
const rush_observer_1 = require("./rush-observer");
/**
 * Stream that emits values, errors, and completion events
 * with built-in memory management, flow control, and resource cleanup
 * @template T - The type of values emitted by the stream
 */
class RushStream {
    /**
     * Creates a new RushStream instance with optimizations
     * @param producer - Function that emits events to the source observer and returns a cleanup function
     * @param options - Configuration options for buffering, error handling, and optimizations
     */
    constructor(producer, options = {}) {
        this.producer = producer;
        /** Flag indicating if middleware processing is enabled */
        this.useHandler = false;
        /** Flag to pause the stream */
        this.isPaused = false;
        /** Flag indicating if the stream is destroyed */
        this.isDestroyed = false;
        /** Time control configuration */
        this.timeControl = {};
        this.sourceObserver = new rush_observer_1.RushObserver({
            continueOnError: options.continueOnError,
        });
        this.outputObserver = new rush_observer_1.RushObserver({
            continueOnError: options.continueOnError,
        });
        this.subscribers = new Set();
        if (options.useObjectPool) {
            const { initialSize = 20, maxSize = 100 } = options.poolConfig || {};
            this.eventPool = (0, manager_1.createEventPool)(initialSize, maxSize);
        }
        if (options.backpressure) {
            this.backpressure = new manager_1.BackpressureController(options.backpressure);
            this.backpressure.onPause(() => {
                var _a, _b;
                this.isPaused = true;
                (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, { type: 'backpressure:pause' });
            });
            this.backpressure.onResume(() => {
                var _a, _b;
                if (this.isPaused) {
                    this.isPaused = false;
                    (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, { type: 'backpressure:resume' });
                }
            });
        }
        if (options.eventTargets && options.eventTargets.length > 0) {
            this.eventCleanup = (0, manager_1.createEventCleanup)(options.eventTargets);
        }
        if (options.debugHook) {
            this.debugHook = options.debugHook;
        }
    }
    /**
     * Processes an event with debounce or throttle control and optimizations
     */
    processEvent(value) {
        if (this.isDestroyed)
            return;
        if (this.eventPool && value instanceof manager_1.PoolableEvent) {
            this.processPoolableEvent(value);
            return;
        }
        const { type, ms, timeout } = this.timeControl;
        if (type && ms && ms > 0) {
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
        else {
            this.emit(value);
        }
    }
    /**
     * Processes a poolable event with special handling
     */
    processPoolableEvent(event) {
        if (!this.eventPool) {
            this.processEvent(event);
            return;
        }
        const pooledEvent = this.eventPool.acquire();
        pooledEvent.init(event.type, event.data, event.source);
        try {
            const { type, ms, timeout } = this.timeControl;
            if (type && ms && ms > 0) {
                if (type === 'debounce') {
                    if (this.timeControl.temp instanceof manager_1.PoolableEvent) {
                        this.eventPool.release(this.timeControl.temp);
                    }
                    this.timeControl.temp = pooledEvent;
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
                    this.emit(pooledEvent);
                    this.timeControl.timeout = setTimeout(() => {
                        this.timeControl.timeout = undefined;
                    }, ms);
                }
                else {
                    this.eventPool.release(pooledEvent);
                }
            }
            else {
                this.emit(pooledEvent);
            }
        }
        catch (err) {
            this.eventPool.release(pooledEvent);
            throw err;
        }
    }
    /**
     * Emits an event to the output observer and broadcasts to subscribers
     * with backpressure control
     */
    emit(value) {
        var _a, _b, _c, _d;
        if (this.isDestroyed)
            return;
        if (this.backpressure) {
            const result = this.backpressure.push(value);
            if (result.accepted) {
                this.outputObserver.next(result.value);
                this.broadcast(result.value);
                (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, result.value);
            }
            else if (result.waitPromise) {
                result.waitPromise
                    .then(() => {
                    var _a, _b;
                    if (!this.isDestroyed) {
                        this.outputObserver.next(value);
                        this.broadcast(value);
                        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onEmit) === null || _b === void 0 ? void 0 : _b.call(_a, value);
                    }
                })
                    .catch((err) => {
                    var _a, _b;
                    if (!this.isDestroyed) {
                        this.outputObserver.error(err);
                        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onError) === null || _b === void 0 ? void 0 : _b.call(_a, err);
                    }
                });
            }
            return;
        }
        if (this.isPaused)
            return;
        this.outputObserver.next(value);
        this.broadcast(value);
        (_d = (_c = this.debugHook) === null || _c === void 0 ? void 0 : _c.onEmit) === null || _d === void 0 ? void 0 : _d.call(_c, value);
    }
    /**
     * Pauses the stream, buffering events if enabled
     */
    pause() {
        this.isPaused = true;
        return this;
    }
    /**
     * Resumes the stream, flushing buffered events
     */
    resume() {
        if (this.isDestroyed)
            return this;
        this.isPaused = false;
        return this;
    }
    /**
     * Adds a listener to the stream
     * @param observer - Observer with optional event handlers
     */
    listen(observer) {
        var _a, _b;
        if (this.isDestroyed)
            return this;
        if (observer.next) {
            this.outputObserver.onNext(observer.next);
        }
        if (observer.error) {
            this.outputObserver.onError((err) => {
                var _a, _b, _c;
                (_a = observer.error) === null || _a === void 0 ? void 0 : _a.call(observer, err);
                (_c = (_b = this.debugHook) === null || _b === void 0 ? void 0 : _b.onError) === null || _c === void 0 ? void 0 : _c.call(_b, err);
            });
            this.sourceObserver.onError((err) => {
                var _a, _b, _c;
                (_a = observer.error) === null || _a === void 0 ? void 0 : _a.call(observer, err);
                (_c = (_b = this.debugHook) === null || _b === void 0 ? void 0 : _b.onError) === null || _c === void 0 ? void 0 : _c.call(_b, err);
            });
        }
        if (observer.complete) {
            this.sourceObserver.onComplete(() => {
                observer.complete();
                this.subscribers.forEach((sub) => sub.complete());
            });
        }
        if (!this.useHandler) {
            this.sourceObserver.onNext((value) => {
                this.processEvent(value);
            });
        }
        const cleanupFn = this.producer(this.sourceObserver);
        if (typeof cleanupFn === 'function')
            this.cleanup = cleanupFn;
        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onListen) === null || _b === void 0 ? void 0 : _b.call(_a, observer);
        return this;
    }
    /**
     * Subscribes a multicast subscriber to the stream
     * @param subscribers - Subscribers to add
     */
    subscribe(...subscribers) {
        var _a, _b;
        if (this.isDestroyed)
            return this;
        for (const sub of subscribers) {
            if (this.subscribers.has(sub))
                continue;
            this.subscribers.add(sub);
            sub.stream = this;
            (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onSubscribe) === null || _b === void 0 ? void 0 : _b.call(_a, sub);
        }
        return this;
    }
    /**
     * Unsubscribes a multicast subscriber
     * @param subscribers - The subscribers to remove
     */
    unsubscribe(...subscribers) {
        var _a, _b;
        if (this.isDestroyed)
            return this;
        for (const sub of subscribers) {
            if (!this.subscribers.has(sub))
                continue;
            this.subscribers.delete(sub);
            sub.stream = undefined;
            (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onUnsubscribe) === null || _b === void 0 ? void 0 : _b.call(_a, sub);
        }
        return this;
    }
    /**
     * Broadcasts an event to all multicast subscribers
     */
    broadcast(value) {
        if (this.isDestroyed)
            return;
        for (const sub of this.subscribers) {
            sub.next(value);
        }
    }
    /**
     * Applies middleware to transform events with retry logic
     * @param args - Middleware functions or array with options
     */
    use(...args) {
        if (this.isDestroyed)
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
            this.outputObserver.error(error);
            (_c = (_b = this.debugHook) === null || _b === void 0 ? void 0 : _b.onError) === null || _c === void 0 ? void 0 : _c.call(_b, error);
        };
        const { applyMiddleware } = (0, retry_1.createRetryWrapper)(middlewares, options, errorHandlerWrapper);
        const newHandler = (value) => {
            try {
                const result = applyMiddleware(value);
                if (result instanceof Promise) {
                    result.then((res) => this.processEvent(res), (err) => errorHandlerWrapper(err));
                }
                else {
                    this.processEvent(result);
                }
            }
            catch (err) {
                errorHandlerWrapper(err);
            }
        };
        this.sourceObserver.onNext(newHandler);
        this.useHandler = true;
        return this;
    }
    /**
     * Stops the stream and emits an event with options
     * @param option - The option to stop the stream (default: `complete`)
     */
    unlisten(option) {
        var _a, _b;
        if (this.isDestroyed)
            return this;
        this.isDestroyed = true;
        if (option === 'destroy') {
            this.sourceObserver.destroy();
            this.outputObserver.destroy();
            this.subscribers.clear();
            this.useHandler = false;
            this.isPaused = false;
            this.clearTimeControl();
        }
        else {
            this.sourceObserver.complete();
            this.outputObserver.complete();
        }
        if (this.cleanup) {
            try {
                this.cleanup();
                this.cleanup = undefined;
            }
            catch (err) {
                console.error('[Asyncrush] Error in cleanup function:', err);
            }
        }
        if (this.backpressure)
            this.backpressure.clear();
        if (this.eventPool)
            this.eventPool.clear();
        if (this.eventCleanup)
            this.eventCleanup.cleanup();
        (_b = (_a = this.debugHook) === null || _a === void 0 ? void 0 : _a.onUnlisten) === null || _b === void 0 ? void 0 : _b.call(_a, option);
        return this;
    }
    /**
     * Set the debounce time in milliseconds
     */
    debounce(ms) {
        if (this.isDestroyed)
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
        if (this.isDestroyed)
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
        if (this.eventPool && this.timeControl.temp instanceof manager_1.PoolableEvent) {
            this.eventPool.release(this.timeControl.temp);
        }
        this.timeControl = {};
    }
    /**
     * Creates a poolable event that can be efficiently reused
     * @param type Event type identifier
     * @param data Event data payload
     * @param source Event source
     * @returns A poolable event instance
     */
    createEvent(type, data, source) {
        if (!this.eventPool) {
            throw new Error('[Asyncrush] Object pooling is not enabled for this stream');
        }
        const event = this.eventPool.acquire();
        return event.init(type, data, source);
    }
    /**
     * Recycles a poolable event back to the pool
     * @param event The event to recycle
     */
    recycleEvent(event) {
        if (!this.eventPool) {
            throw new Error('[Asyncrush] Object pooling is not enabled for this stream');
        }
        this.eventPool.release(event);
    }
    /**
     * Gets the underlying backpressure controller
     */
    getBackpressureController() {
        return this.backpressure;
    }
    /**
     * Gets the underlying event cleanup manager
     */
    getEventCleanup() {
        return this.eventCleanup;
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
    /**
     * Registers a DOM event listener with automatic cleanup
     * @param target DOM element
     * @param eventName Event name
     * @param listener Event handler
     * @param options Event listener options
     */
    addDOMListener(target, eventName, listener, options) {
        if (!this.eventCleanup) {
            throw new Error('[Asyncrush] Event cleanup is not enabled for this stream');
        }
        return this.eventCleanup.addDOMListener(target, eventName, listener, options);
    }
    /**
     * Registers an EventEmitter listener with automatic cleanup
     * @param emitter EventEmitter instance
     * @param eventName Event name
     * @param listener Event handler
     */
    addEmitterListener(emitter, eventName, listener) {
        if (!this.eventCleanup) {
            throw new Error('[Asyncrush] Event cleanup is not enabled for this stream');
        }
        return this.eventCleanup.addEmitterListener(emitter, eventName, listener);
    }
}
exports.RushStream = RushStream;
