import { RushMiddleware, RushUseOption } from '../types';
/**
 * Creates a retry wrapper for middleware chains with optimized execution paths
 * @param middlewares Array of middleware functions to execute
 * @param options Configuration for retry behavior
 * @param errorHandler Function to call when errors occur
 * @returns Object with middleware application function
 */
export declare const createRetryWrapper: <T>(middlewares: RushMiddleware<T, T>[], options: RushUseOption, errorHandler: (error: unknown) => void) => {
    applyMiddleware: (value: T, attempt?: number) => T | Promise<T>;
};
