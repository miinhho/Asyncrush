export interface RushListenOption {
    readonly errorHandler?: (error: unknown) => void;
    readonly retries?: number;
    readonly retryDelay?: number;
    readonly maxRetryDelay?: number;
    readonly jitter?: number;
    readonly delayFn?: (attempt: number, baseDelay: number) => number;
    readonly continueOnError?: boolean;
}
