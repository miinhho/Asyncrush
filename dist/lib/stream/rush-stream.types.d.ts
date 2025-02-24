/**
 * Options for RushStream listen method
 */
export interface RushListenOption {
    /** Error handler for middlewares in use method */
    readonly errorHandler?: (error: unknown) => void;
    /** Retries while error resolved */
    readonly retries?: number;
    /** Retry delay */
    readonly retryDelay?: number;
    /** Max retry delay */
    readonly maxRetryDelay?: number;
    /** Jitter for randomizing retry delay time */
    readonly jitter?: number;
    /** Function for setting delay time by attempt */
    readonly delayFn?: (attempt: number, baseDelay: number) => number;
    /** Flag to middlewares in use method will continue in error */
    readonly continueOnError?: boolean;
}
