"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushObserver = void 0;
/**
 * Observer that emits values, errors, and completion events with chained handler support
 * @template T - Type of values emitted by the observer
 * @implements {RushObserverImpl}
 */
class RushObserver {
    /**
     * Creates a new RushObserver instance
     * @param options - Configuration options, including error continuation
     */
    constructor(options = {}) {
        this.options = options;
        /** Handler for 'next' events, chained for multiple listeners */
        this.nextHandler = null;
        /** Handler for 'error' events, chained for multiple error listeners */
        this.errorHandler = null;
        /** Handler for 'complete' events, chained for multiple completion listeners */
        this.completeHandler = null;
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
     * Emits an error to all chained 'error' handlers
     * @param err - The error to emit
     */
    error(err) {
        var _a;
        if (this.errorHandler) {
            this.errorHandler(err);
            if (!((_a = this.options) === null || _a === void 0 ? void 0 : _a.continueOnError))
                this.destroy();
        }
    }
    /**
     * Signals completion to all chained 'complete' handlers
     */
    complete() {
        if (this.completeHandler) {
            this.completeHandler();
            this.cleanHandlers();
        }
    }
    /**
     * Registers a handler for a specific event type, chaining with existing handlers
     * @param event - Event type ('next', 'error', 'complete')
     * @param handler - Callback function to handle the event
     */
    on(event, handler) {
        switch (event) {
            case 'next':
                const prevNext = this.nextHandler;
                this.nextHandler = prevNext
                    ? (value) => {
                        prevNext(value);
                        handler(value);
                    }
                    : handler;
                break;
            case 'error':
                const prevError = this.errorHandler;
                this.errorHandler = prevError
                    ? (err) => {
                        prevError(err);
                        handler(err);
                    }
                    : handler;
                break;
            case 'complete':
                const prevComplete = this.completeHandler;
                this.completeHandler = prevComplete
                    ? () => {
                        prevComplete();
                        handler();
                    }
                    : handler;
                break;
        }
    }
    /**
     * Destroys the observer, marking it as completed and clearing handlers
     */
    destroy() {
        this.cleanHandlers();
    }
    /**
     * Clears all event handlers to free resources
     */
    cleanHandlers() {
        this.nextHandler = null;
        this.errorHandler = null;
        this.completeHandler = null;
    }
}
exports.RushObserver = RushObserver;
//# sourceMappingURL=rush-observer.js.map