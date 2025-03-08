import { RushMiddleware, RushUseOption } from '../types';

/**
 * Calculate retry delay with jitter
 * @param attempt Current attempt number
 * @param options Retry configuration options
 * @returns Delay in milliseconds
 */
const calculateRetryDelay = (
  attempt: number,
  options: Required<
    Pick<RushUseOption, 'retryDelay' | 'maxRetryDelay' | 'jitter' | 'delayFn'>
  >
): number => {
  let delay = options.delayFn(attempt, options.retryDelay);

  if (options.jitter > 0) {
    const jitterFactor = 1 + options.jitter * (Math.random() * 2 - 1);
    delay *= jitterFactor;
  }

  return Math.min(delay, options.maxRetryDelay);
};

/**
 * Creates a retry wrapper for middleware chains with optimized execution paths
 * @param middlewares Array of middleware functions to execute
 * @param options Configuration for retry behavior
 * @param errorHandler Function to call when errors occur
 * @returns Object with middleware application function
 */
export const createRetryWrapper = <T>(
  middlewares: RushMiddleware<T, T>[],
  options: RushUseOption,
  errorHandler: (error: unknown) => void
) => {
  const {
    retries = 0,
    retryDelay = 0,
    maxRetryDelay = Infinity,
    jitter = 0,
    delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt),
  } = options;

  const retryConfig = {
    retryDelay,
    maxRetryDelay,
    jitter,
    delayFn,
  };

  /**
   * Schedule a retry after calculated delay
   * @param attempt Current attempt number
   * @param value Value to retry processing with
   * @returns Promise resolving to processed value
   */
  const scheduleRetry = (attempt: number, value: T): Promise<T> => {
    const delay = calculateRetryDelay(attempt, retryConfig);

    return new Promise((resolve) =>
      setTimeout(() => resolve(applyMiddleware(value, attempt + 1)), delay)
    );
  };

  /**
   * Optimized synchronous middleware application
   * @param value Value to process
   * @param middlewareChain Array of middleware functions
   * @param startIndex Index to start processing from
   * @returns Processed value
   */
  const applySyncMiddleware = (
    value: T,
    middlewareChain: RushMiddleware<T, T>[],
    startIndex: number = 0
  ): T => {
    let result = value;

    for (let i = startIndex; i < middlewareChain.length; i++) {
      result = middlewareChain[i](result) as T;
    }

    return result;
  };

  /**
   * Apply the middleware chain to a value with retry support
   * @param value Value to process
   * @param attempt Current attempt number (0 for first try)
   * @returns Processed value or Promise of processed value
   */
  const applyMiddleware = (value: T, attempt: number = 0): T | Promise<T> => {
    if (retries === 0 && middlewares.length > 0) {
      try {
        return applySyncMiddleware(value, middlewares);
      } catch (error) {
        errorHandler(error);
        throw error;
      }
    }

    if (middlewares.length === 0) {
      return value;
    }

    let result: T | Promise<T> = value;

    for (let i = 0; i < middlewares.length; i++) {
      const middleware = middlewares[i];

      if (result instanceof Promise) {
        result = result
          .then((val) => {
            try {
              return middleware(val);
            } catch (error) {
              if (attempt < retries) {
                return scheduleRetry(attempt, value);
              }
              errorHandler(error);
              throw error;
            }
          })
          .catch((error) => {
            if (attempt < retries) {
              return scheduleRetry(attempt, value);
            }
            errorHandler(error);
            throw error;
          });
      } else {
        try {
          result = middleware(result);
        } catch (error) {
          if (attempt < retries) {
            return scheduleRetry(attempt, value);
          }
          errorHandler(error);
          throw error;
        }
      }
    }

    return result;
  };

  return { applyMiddleware };
};
