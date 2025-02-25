"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushStream = void 0;
const observer_1 = require("../observer");
const processor_1 = require("../processor");
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
        this.sourceObserver = new observer_1.RushObserver();
        /** Output observer distributing events to listeners and subscribers */
        this.outputObserver = new observer_1.RushObserver();
        /** Handler for connect source & output observer */
        this.useHandler = null;
        /** Array of subscribers for multicast broadcasting */
        this.subscribers = [];
        /** Cleanup function returned by the producer */
        this.cleanup = () => { };
        /** Flag to enable error continuation */
        this.continueOnError = false;
        /** Buffer to store events when paused */
        this.buffer = new processor_1.RushBuffer();
        /** Middleware processor to apply transformations and retry logic */
        this.middlewareProcessor = null;
        this.continueOnError = (_a = options.continueOnError) !== null && _a !== void 0 ? _a : false;
        this.sourceObserver = new observer_1.RushObserver({ continueOnError: options.continueOnError });
        this.outputObserver = new observer_1.RushObserver({ continueOnError: options.continueOnError });
        if (options.useBuffer) {
            this.buffer = new processor_1.RushBuffer((_b = options.maxBufferSize) !== null && _b !== void 0 ? _b : 1000);
        }
        this.eventProcessor = new processor_1.RushEventProcessor((value) => this.emit(value));
    }
    /** Emits an event to the output observer and broadcasts to subscribers */
    emit(value) {
        if (this.buffer.paused) {
            this.buffer.add(value);
        }
        else {
            this.outputObserver.next(value);
            this.broadcast(value);
        }
    }
    /**
     * Adds a listener to the stream with traditional observer pattern
     * @param observer - Observer with optional event handlers
     */
    listen(observer) {
        if (observer.next) {
            this.outputObserver.on('next', (value) => {
                observer.next(value);
            });
        }
        if (observer.error)
            this.outputObserver.on('error', observer.error);
        if (observer.complete)
            this.outputObserver.on('complete', observer.complete);
        if (!this.useHandler) {
            this.sourceObserver.on('next', (value) => {
                this.eventProcessor.process(value);
            });
        }
        else {
            this.sourceObserver.on('next', this.useHandler);
        }
        const cleanupFn = this.producer(this.sourceObserver);
        this.cleanup = cleanupFn !== null && cleanupFn !== void 0 ? cleanupFn : (() => { });
        return this;
    }
    /**
     * Subscribes a new observer for multicast events
     * @returns New RushObserver instance for the subscriber
     */
    subscribe() {
        const sub = new observer_1.RushObserver({ continueOnError: this.continueOnError });
        this.subscribers.push(sub);
        if (!this.isPaused()) {
            this.buffer.resume((value) => sub.next(value));
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
        let middlewares = [];
        let middlewareOptions = {};
        if (Array.isArray(args[0])) {
            middlewares = args[0];
            middlewareOptions = args[1] && typeof args[1] === 'object' ? args[1] : {};
        }
        else {
            middlewares = args;
        }
        const { retry, options } = (this.middlewareProcessor)
            ? this.middlewareProcessor.add(...middlewares).withRetry()
            : new processor_1.RushMiddlewareProcessor(middlewares, middlewareOptions).withRetry();
        const { errorHandler, continueOnError } = options;
        this.useHandler = (value) => {
            const result = retry(value);
            if (result instanceof Promise) {
                result.then((res) => {
                    this.emit(res);
                }, (err) => {
                    if (errorHandler)
                        errorHandler(err);
                    if (!continueOnError)
                        this.outputObserver.error(err);
                });
            }
            else {
                try {
                    this.emit(result);
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
    /** Stops the stream and emits an event */
    unlisten(option) {
        if (option === 'destroy')
            this.outputObserver.destroy();
        else
            this.outputObserver.complete();
        this.cleanup();
        return this;
    }
    /** Get the stream is paused or not */
    isPaused() {
        return this.buffer.paused;
    }
    /** Pauses the stream, buffering events if enabled */
    pause() {
        this.buffer.pause();
        return this;
    }
    /** Resumes the stream, flushing buffered events */
    resume() {
        this.buffer.resume((value) => this.emit(value));
        return this;
    }
    /** Set the debounce time in milliseconds  */
    debounce(ms) {
        this.eventProcessor.setDebounce(ms);
        return this;
    }
    /** Set the throttle time in milliseconds  */
    throttle(ms) {
        this.eventProcessor.setThrottle(ms);
        return this;
    }
}
exports.RushStream = RushStream;
//# sourceMappingURL=rush-stream.js.map