import { RushListenOption } from "../stream/rush-stream.types";
import { RushMiddleware } from "./rush-middleware.types";

/**
 * Processor that applies middlewares to values
 * @template T - The type of values processed by the middlewares
 */
export class RushMiddlewareProcessor<T> {
  /**
   * Creates a new RushMiddlewareProcessor instance
   * @param middlewares - Array of middlewares to apply to values
   * @param options - Options for retrying middleware
   */
  constructor(
    private middlewares: RushMiddleware<T, T>[],
    private options: RushListenOption = {}
  ) { }

  add(...middlewares: RushMiddleware<T, T>[]): this {
    this.middlewares.push(...middlewares);
    return this;
  }

  /**
   * Apply middlewares to value and return result
   * @param value - Value to apply middlewares
   */
  apply(value: T): T | Promise<T> {
    let result: T | Promise<T> = value;
    for (const middleware of this.middlewares) {
      if (result instanceof Promise) {
        result = result.then((value) => middleware(value));
      } else {
        result = middleware(result);
      }
    }
    return result;
  }

  /**
   * Retry middleware with options
   * @param value - Value to apply middlewares
   */
  withRetry(): {
    retry: (value: T, attempt?: number) => T | Promise<T>;
    options: RushListenOption
  } {
    const { errorHandler,
      retries = 0,
      retryDelay = 0,
      maxRetryDelay = Infinity,
      jitter = 0,
      delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt),
      continueOnError = false
    } = this.options;

    const scheduleRetry = (attempt: number, value: T): Promise<T> => {
      let delay = delayFn(attempt, retryDelay);
      if (jitter > 0) {
        const jitterFactor = 1 + jitter * (Math.random() * 2 - 1);
        delay *= jitterFactor;
      }
      delay = Math.min(delay, maxRetryDelay);
      return new Promise((resolve) => setTimeout(() => resolve(retry(value, attempt + 1)), delay));
    };

    const retry = (value: T, attempt = 0): T | Promise<T> => {
      if (retries === 0) return this.apply(value);
      const result = this.apply(value);
      if (result instanceof Promise) {
        return result.catch((error) => {
          if (attempt < retries) {
            return scheduleRetry(attempt, value);
          }
          throw error;
        });
      }
      try {
        return result;
      } catch (error) {
        if (attempt < retries) {
          return scheduleRetry(attempt, value);
        }
        throw error;
      }
    };

    return {
      retry,
      options: this.options
    };
  }
}
