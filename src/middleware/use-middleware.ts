import { EmitObserver } from "@emiter/emit-observer";
import { EmitStream } from "@emiter/emit-stream";
import { EmitMiddleware } from "./middleware.types";

/**
 * Middleware options
 * @param retries - Number of retries
 * @param retryDelay - Delay between retries
 * @param maxRetryDelay - Maximum delay between retries
 * @param jitter - Jitter factor for randomization
 * @param delayFn - Custom delay function for retries
 * @param continueOnError - Whether to continue the stream on error
 */
export interface EmitMiddlewareOption {
  /** Custom error handler */
  errorHandler?: (error: unknown) => void;
  /** Number of retries for failed transformations */
  retries?: number;
  /** Base delay between retries in milliseconds */
  retryDelay?: number;
  /** Maximum delay between retries (optional, for backoff) */
  maxRetryDelay?: number;
  /** Jitter factor (0 to 1, e.g., 0.2 for ±20%) for randomization */
  jitter?: number;
  /** Custom delay function for retries */
  delayFn?: (attempt: number, baseDelay: number) => number;
  /** Whether to continue the stream on error */
  continueOnError?: boolean;
}


/**
 * Creates a middleware for EmitStream supporting sync or async transformations
 * @template T - Input value type
 * @template R - Output value type
 * @param fn - Transformation function (sync or async)
 * @param options - Middleware options
 * @returns Middleware function that transforms stream values
 */
export function useMiddleware<T = any, R = T>(
  fn: (value: T) => R | Promise<R>, options: EmitMiddlewareOption = {}
): EmitMiddleware<T, R> {
  const {
    errorHandler,
    retries = 0,
    retryDelay = 0,
    maxRetryDelay = Infinity,
    jitter = 0,
    delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt),
    continueOnError = false,
  } = options;

  const withRetry = async (value: T): Promise<R> => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await Promise.resolve(fn(value));
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          let delay = delayFn(attempt, retryDelay);
          if (jitter > 0) {
            const jitterFactor = 1 + jitter * (Math.random() * 2 - 1);
            delay *= jitterFactor;
          }
          delay = Math.min(delay, maxRetryDelay);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    throw lastError;
  };

  return (source: EmitStream<T>): EmitStream<R> => {
    return new EmitStream<R>((observer: EmitObserver<R>) => {
      const listener = source.listen({
        next: async (value: T) => {
          try {
            const result = retries > 0 ? withRetry(value) : await Promise.resolve(fn(value));
            observer.next(result instanceof Promise ? await result : result);
          } catch (err) {
            if (errorHandler) errorHandler(err);
            if (continueOnError) return;
            observer.error(err);
          }
        },
        error: (err: unknown) => observer.error(err),
        complete: () => observer.complete()
      });

      return () => listener.unlisten('complete');
    }, { continueOnError });
  }
}

/**
 * Creates an async-only middleware for EmitStream
 * @template T - Input value type
 * @template R - Output value type
 * @param fn - Asynchronous transformation function
 * @param options - Middleware options
 * @returns Middleware function that transforms stream values
 */
export function useAsyncMiddleware<T = any, R = T>(
  fn: (value: T) => Promise<R>, options: EmitMiddlewareOption = {}
): EmitMiddleware<T, R> {
  const {
    errorHandler,
    retries = 0,
    retryDelay = 0,
    maxRetryDelay = Infinity,
    jitter = 0,
    delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt),
    continueOnError = false,
  } = options;

  const withRetry = async (value: T): Promise<R> => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn(value);
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          let delay = delayFn(attempt, retryDelay);
          if (jitter > 0) {
            const jitterFactor = 1 + jitter * (Math.random() * 2 - 1);
            delay *= jitterFactor;
          }
          delay = Math.min(delay, maxRetryDelay);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    throw lastError;
  };

  return (source: EmitStream<T>): EmitStream<R> => {
    return new EmitStream<R>((observer: EmitObserver<R>) => {
      const listener = source.listen({
        next: async (value: T) => {
          try {
            const result = retries > 0 ? await withRetry(value) : await fn(value);
            observer.next(result);
          } catch (err) {
            if (errorHandler) errorHandler(err);
            if (continueOnError) return;
            observer.error(err);
          }
        },
        error: (err: unknown) => observer.error(err),
        complete: () => observer.complete()
      });

      return () => listener.unlisten('complete');
    }, { continueOnError });
  }
}
