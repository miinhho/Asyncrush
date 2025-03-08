"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushObserver = void 0;
/**
 * Optimized observer that emits values, errors, and completion events with handler support
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
        /** Flag indicating if the observer is active */
        this.isActive = true;
        this.continueOnError = !!options.continueOnError;
    }
    /**
     * Emits a value to all chained 'next' handlers
     * @param value - The value to emit
     */
    next(value) {
        if (!this.isActive)
            return;
        if (this.nextHandler) {
            try {
                this.nextHandler(value);
            }
            catch (err) {
                this.error(err);
            }
        }
    }
    /**
     * Emits an error to 'error' handlers
     * @param err - The error to emit
     */
    error(err) {
        if (!this.isActive)
            return;
        if (this.errorHandler) {
            try {
                this.errorHandler(err);
            }
            catch (nestedError) {
                console.error('Error in error handler:', nestedError);
            }
        }
        if (!this.continueOnError)
            this.destroy();
    }
    /**
     * Signals completion to 'complete' handlers
     */
    complete() {
        if (!this.isActive)
            return;
        if (this.completeHandler) {
            try {
                this.completeHandler();
            }
            catch (err) {
                console.error('Error in complete handler:', err);
            }
        }
        this.cleanHandlers();
        this.isActive = false;
    }
    /**
     * Adds a handler for 'next' events, chaining with existing handlers
     * @param handler - The handler to add
     */
    onNext(handler) {
        if (!this.isActive)
            return;
        this.nextHandler = handler;
    }
    /**
     * Adds a handler for 'error' events
     * @param handler - The handler to add
     */
    onError(handler) {
        if (!this.isActive)
            return;
        this.errorHandler = handler;
    }
    /**
     * Adds a handler for 'complete' events
     * @param handler - The handler to add
     */
    onComplete(handler) {
        if (!this.isActive)
            return;
        this.completeHandler = handler;
    }
    /**
     * Destroys the observer, clearing handlers
     */
    destroy() {
        this.cleanHandlers();
        this.isActive = false;
    }
    /**
     * Checks if the observer is active
     */
    isDestroyed() {
        return !this.isActive;
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
