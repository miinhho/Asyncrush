/** Interface for the RushObserver */
export interface RushObserverImpl<T> {

  /** Emits the next value */
  readonly next: (value: T) => void;

  /** Emits an error */
  readonly error: (err: unknown) => void;

  /** Emits the completion event */
  readonly complete: () => void;
}

/** Partial type for observer's stream options */
export type RushObserveStream<T> = Partial<RushObserverImpl<T>>;


/**
 * Middleware function type
 * @param value - The input value
 * @returns The output value or a promise that resolves to the output value
 */
export type RushMiddleware<I, O> = (value: I) => O | Promise<O>;

/** Options for retry wrapper function */
export interface RushMiddlewareOption {
  /** Retries while error resolved */
  readonly retries: number;

  /** Retry delay */
  readonly retryDelay: number;

  /** Max retry delay */
  readonly maxRetryDelay: number;

  /** Jitter for randomizing retry delay time */
  readonly jitter: number;

  /** Function for setting delay time by attempt */
  readonly delayFn: (attempt: number, baseDelay: number) => number;
}

/** Options for `use` method */
export interface RushUseOption extends Partial<RushMiddlewareOption> {
  readonly errorHandler?: (error: unknown) => void;
}
