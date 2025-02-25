import { RushListenOption } from "../stream/rush-stream.types";
import { RushMiddleware } from "./rush-middleware.types";
/**
 * Processor that applies middlewares to values
 * @template T - The type of values processed by the middlewares
 */
export declare class RushMiddlewareProcessor<T> {
    private middlewares;
    private options;
    /**
     * Creates a new RushMiddlewareProcessor instance
     * @param middlewares - Array of middlewares to apply to values
     * @param options - Options for retrying middleware
     */
    constructor(middlewares: RushMiddleware<T, T>[], options?: RushListenOption);
    add(...middlewares: RushMiddleware<T, T>[]): this;
    /**
     * Apply middlewares to value and return result
     * @param value - Value to apply middlewares
     */
    apply(value: T): T | Promise<T>;
    /**
     * Retry middleware with options
     * @param value - Value to apply middlewares
     */
    withRetry(): {
        retry: (value: T, attempt?: number) => T | Promise<T>;
        options: RushListenOption;
    };
}
