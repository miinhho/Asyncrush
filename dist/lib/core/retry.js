"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRetryWrapper = void 0;
/**
 * Calculate retry delay with jitter
 * @param attempt Current attempt number
 * @param options Retry configuration options
 * @returns Delay in milliseconds
 */
const calculateRetryDelay = (attempt, options) => {
    let delay = options.delayFn(attempt, options.retryDelay);
    if (options.jitter > 0) {
        const jitterFactor = 1 + options.jitter * (Math.random() * 2 - 1);
        delay *= jitterFactor;
    }
    return Math.min(delay, options.maxRetryDelay);
};
/**
 * Creates a retry wrapper for middleware chains with optimized execution paths
 * @param middlewares Array of middleware functions to execute
 * @param options Configuration for retry behavior
 * @param errorHandler Function to call when errors occur
 * @returns Object with middleware application function
 */
const createRetryWrapper = (middlewares, options, errorHandler) => {
    const { retries = 0, retryDelay = 0, maxRetryDelay = Infinity, jitter = 0, delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt), } = options;
    const retryConfig = {
        retryDelay,
        maxRetryDelay,
        jitter,
        delayFn,
    };
    /**
     * Schedule a retry after calculated delay
     * @param attempt Current attempt number
     * @param value Value to retry processing with
     * @returns Promise resolving to processed value
     */
    const scheduleRetry = (attempt, value) => {
        const delay = calculateRetryDelay(attempt, retryConfig);
        return new Promise((resolve) => setTimeout(() => resolve(applyMiddleware(value, attempt + 1)), delay));
    };
    /**
     * Apply synchronous middleware chain
     * @param value Value to process
     * @param middlewareChain Array of middleware functions
     * @returns Processed value
     */
    const applySyncMiddleware = (value, middlewareChain) => {
        let result = value;
        for (let i = 0; i < middlewareChain.length; i++) {
            result = middlewareChain[i](result);
        }
        return result;
    };
    /**
     * Process middleware chain with proper promise handling
     * @param value Initial value
     * @param attempt Current retry attempt
     * @returns Promise of processed value
     */
    const processAsyncMiddleware = (value, attempt) => __awaiter(void 0, void 0, void 0, function* () {
        let currentValue = value;
        for (let i = 0; i < middlewares.length; i++) {
            try {
                const result = middlewares[i](currentValue);
                currentValue = yield result;
            }
            catch (error) {
                if (attempt < retries) {
                    return scheduleRetry(attempt, value);
                }
                errorHandler(error);
                throw error;
            }
        }
        return currentValue;
    });
    /**
     * Check if a value is a promise or promise-like object
     * @param value Value to check
     * @returns Whether the value is a promise
     */
    const isPromise = (value) => {
        return value && typeof value.then === 'function';
    };
    /**
     * Apply the middleware chain to a value with retry support
     * @param value Value to process
     * @param attempt Current attempt number (0 for first try)
     * @returns Processed value or Promise of processed value
     */
    const applyMiddleware = (value, attempt = 0) => {
        if (middlewares.length === 0) {
            return value;
        }
        if (attempt === 0 && retries === 0) {
            try {
                let isAsync = false;
                let currentValue = value;
                for (let i = 0; i < middlewares.length && !isAsync; i++) {
                    const middleware = middlewares[i];
                    const result = middleware(currentValue);
                    if (isPromise(result)) {
                        isAsync = true;
                    }
                    else {
                        currentValue = result;
                    }
                }
                if (!isAsync) {
                    return applySyncMiddleware(value, middlewares);
                }
            }
            catch (error) {
                errorHandler(error);
                throw error;
            }
        }
        try {
            return processAsyncMiddleware(value, attempt);
        }
        catch (error) {
            if (attempt < retries) {
                return scheduleRetry(attempt, value);
            }
            errorHandler(error);
            throw error;
        }
    };
    return { applyMiddleware };
};
exports.createRetryWrapper = createRetryWrapper;
