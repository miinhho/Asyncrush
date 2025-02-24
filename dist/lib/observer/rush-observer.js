"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushObserver = void 0;
/**
 * An observer that can emit values, errors and completion events
 * @implements {RushObserverImpl}
 */
class RushObserver {
    constructor(options = {}) {
        this.options = options;
        this.nextHandler = null;
        this.errorHandler = null;
        this.completeHandler = null;
        this.isCompleted = false;
    }
    next(value) {
        if (!this.isCompleted && this.nextHandler)
            this.nextHandler(value);
    }
    error(err) {
        var _a;
        if (!this.isCompleted && this.errorHandler)
            this.errorHandler(err);
        if (!((_a = this.options) === null || _a === void 0 ? void 0 : _a.continueOnError))
            this.destroy();
    }
    complete() {
        if (!this.isCompleted && this.completeHandler) {
            this.isCompleted = true;
            this.completeHandler();
            this.cleanHandlers();
        }
    }
    on(event, handler) {
        if (this.isCompleted)
            return;
        if (event === 'next') {
            const prevHandler = this.nextHandler;
            this.nextHandler = prevHandler
                ? (value) => {
                    prevHandler(value);
                    handler(value);
                }
                : handler;
        }
        else if (event === 'error') {
            const prevHandler = this.errorHandler;
            this.errorHandler = prevHandler
                ? (err) => {
                    prevHandler(err);
                    handler(err);
                }
                : handler;
        }
        else if (event === 'complete') {
            const prevHandler = this.completeHandler;
            this.completeHandler = prevHandler
                ? () => {
                    prevHandler();
                    handler();
                }
                : handler;
        }
    }
    destroy() {
        this.isCompleted = true;
        this.cleanHandlers();
    }
    cleanHandlers() {
        this.nextHandler = null;
        this.errorHandler = null;
        this.completeHandler = null;
    }
}
exports.RushObserver = RushObserver;
//# sourceMappingURL=rush-observer.js.map