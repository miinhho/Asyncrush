import { RushMiddleware, RushUseOption } from '../';
/**
 * Creates a retry wrapper for middleware chains
 * @param options - Configuration for retry behavior
 * @returns Object with middleware application function
 */
export declare const createRetryWrapper: <T>(middlewares: RushMiddleware<T, T>[], options: RushUseOption, errorHandler: (error: unknown) => void) => {
    applyMiddleware: (value: T, attempt?: number) => T | Promise<T>;
};
