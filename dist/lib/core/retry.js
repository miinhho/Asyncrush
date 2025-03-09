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
    const scheduleRetry = (attempt, value) => {
        const delay = calculateRetryDelay(attempt, retryConfig);
        return new Promise((resolve) => setTimeout(() => resolve(applyMiddleware(value, attempt + 1)), delay));
    };
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
    const isPromise = (value) => {
        return value && typeof value.then === 'function';
    };
    const applyMiddleware = (value, attempt = 0) => {
        if (middlewares.length === 0) {
            return value;
        }
        if (attempt === 0 && retries === 0) {
            try {
                const firstResult = middlewares[0](value);
                if (!isPromise(firstResult)) {
                    let currentValue = firstResult;
                    for (let i = 1; i < middlewares.length; i++) {
                        const result = middlewares[i](currentValue);
                        if (isPromise(result)) {
                            return Promise.resolve(firstResult)
                                .then(() => processAsyncMiddleware(value, attempt));
                        }
                        currentValue = result;
                    }
                    return currentValue;
                }
            }
            catch (error) {
                errorHandler(error);
                throw error;
            }
        }
        return processAsyncMiddleware(value, attempt);
    };
    return { applyMiddleware };
};
exports.createRetryWrapper = createRetryWrapper;
