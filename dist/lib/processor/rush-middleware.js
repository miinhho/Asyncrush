"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushMiddlewareProcessor = void 0;
/**
 * Processor that applies middlewares to values
 * @template T - The type of values processed by the middlewares
 */
class RushMiddlewareProcessor {
    /**
     * Creates a new RushMiddlewareProcessor instance
     * @param middlewares - Array of middlewares to apply to values
     * @param options - Options for retrying middleware
     */
    constructor(middlewares, options = {}) {
        this.middlewares = middlewares;
        this.options = options;
    }
    add(...middlewares) {
        this.middlewares.push(...middlewares);
        return this;
    }
    /**
     * Apply middlewares to value and return result
     * @param value - Value to apply middlewares
     */
    apply(value) {
        let result = value;
        for (const middleware of this.middlewares) {
            if (result instanceof Promise) {
                result = result.then((value) => middleware(value));
            }
            else {
                result = middleware(result);
            }
        }
        return result;
    }
    /**
     * Retry middleware with options
     * @param value - Value to apply middlewares
     */
    withRetry() {
        const { errorHandler, retries = 0, retryDelay = 0, maxRetryDelay = Infinity, jitter = 0, delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt), continueOnError = false } = this.options;
        const scheduleRetry = (attempt, value) => {
            let delay = delayFn(attempt, retryDelay);
            if (jitter > 0) {
                const jitterFactor = 1 + jitter * (Math.random() * 2 - 1);
                delay *= jitterFactor;
            }
            delay = Math.min(delay, maxRetryDelay);
            return new Promise((resolve) => setTimeout(() => resolve(retry(value, attempt + 1)), delay));
        };
        const retry = (value, attempt = 0) => {
            if (retries === 0)
                return this.apply(value);
            const result = this.apply(value);
            if (result instanceof Promise) {
                return result.catch((error) => {
                    if (attempt < retries) {
                        return scheduleRetry(attempt, value);
                    }
                    throw error;
                });
            }
            try {
                return result;
            }
            catch (error) {
                if (attempt < retries) {
                    return scheduleRetry(attempt, value);
                }
                throw error;
            }
        };
        return {
            retry,
            options: this.options
        };
    }
}
exports.RushMiddlewareProcessor = RushMiddlewareProcessor;
//# sourceMappingURL=rush-middleware.js.map