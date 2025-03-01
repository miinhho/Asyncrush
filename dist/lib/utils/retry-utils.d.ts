import { RushMiddleware, RushMiddlewareOption } from "../types";
/**
 * Creates a retry wrapper for middleware chains
 * @param options - Configuration for retry behavior
 * @returns Object with middleware application function
 */
export declare function createRetryWrapper<T>(middlewares: RushMiddleware<T, T>[], options: RushMiddlewareOption, errorHandler: (error: unknown) => void): {
    applyMiddleware: (value: T, attempt?: number) => T | Promise<T>;
};
