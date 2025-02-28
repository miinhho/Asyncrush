"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushSubscriber = void 0;
const rush_observer_1 = require("../observer/rush-observer");
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
        if (options.maxBufferSize) {
            this.maxBufferSize = options.maxBufferSize;
            this.buffer = [];
        }
    }
    /** Emits a value to all chained 'next' handlers */
    next(value) {
        if (this.isPaused && this.maxBufferSize) {
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
    use(...middlewares) {
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
        this.onNext((value) => {
            applyMiddleware(value);
        });
        return this;
    }
    /** Unsubscribes from the stream and clear buffer */
    unsubscribe() {
        if (this.stream)
            this.stream.unsubscribe(this);
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
        while (this.buffer.length > 0 && !this.isPaused && this.maxBufferSize) {
            try {
                this.next(this.buffer.shift());
            }
            catch (err) {
                this.error(err);
            }
        }
        return this;
    }
    /** Destroy the subscriber */
    destroy() {
        this.unsubscribe();
        super.destroy();
    }
}
exports.RushSubscriber = RushSubscriber;
