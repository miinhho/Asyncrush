"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushObserver = void 0;
/**
 * Observer that emits values, errors, and completion events with handler support
 * @template T - Type of values emitted by the observer
 * @implements {RushObserverImpl}
 */
class RushObserver {
    /**
     * Creates a new RushObserver instance
     * @param options - Whether to continue on error
     */
    constructor(options = {}) {
        /** Flag to enable error continuation */
        this.continueOnError = false;
        this.continueOnError = !!options.continueOnError;
    }
    /**
     * Emits a value to all chained 'next' handlers
     * @param value - The value to emit
     */
    next(value) {
        if (this.nextHandler)
            this.nextHandler(value);
    }
    /**
     * Emits an error to 'error' handlers
     * @param err - The error to emit
     */
    error(err) {
        if (this.errorHandler)
            this.errorHandler(err);
        if (!this.continueOnError)
            this.destroy();
    }
    /**
     * Signals completion to 'complete' handlers
     */
    complete() {
        if (this.completeHandler)
            this.completeHandler();
        this.cleanHandlers();
    }
    /**
     * Adds a handlers for 'next' events, chaining with existing handlers
     * @param handlers - The handlers to add
     */
    onNext(handler) {
        const prevNext = this.nextHandler;
        this.nextHandler = (value) => {
            try {
                if (prevNext)
                    prevNext(value);
                handler(value);
            }
            catch (err) {
                this.error(err);
            }
        };
    }
    /**
     * Adds a handler for 'error' events
     * @param handler - The handler to add
     */
    onError(handler) {
        this.errorHandler = handler;
    }
    /**
     * Adds a handler for 'complete' events
     * @param handler - The handler to add
     */
    onComplete(handler) {
        this.completeHandler = handler;
    }
    /**
     * Destroys the observer, and clearing handlers
     */
    destroy() {
        this.cleanHandlers();
    }
    /**
     * Clears all event handlers to free resources
     */
    cleanHandlers() {
        this.nextHandler = undefined;
        this.errorHandler = undefined;
        this.completeHandler = undefined;
    }
}
exports.RushObserver = RushObserver;
