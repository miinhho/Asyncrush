export interface EmitMiddlewareOption {
  errorHandler?: (error: unknown) => void;
  retries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
  jitter?: number;
  delayFn?: (attempt: number, baseDelay: number) => number;
  continueOnError?: boolean;
}
