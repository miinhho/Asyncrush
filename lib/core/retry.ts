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

  // Calcaulate delay with config and return promise for that
  const scheduleRetry = (attempt: number, value: T): Promise<T> => {
    const delay = calculateRetryDelay(attempt, retryConfig);

    return new Promise((resolve) =>
      setTimeout(() => resolve(applyMiddleware(value, attempt + 1)), delay)
    );
  };

  // Asynchronous middleware processing function
  // Processing all middleware asynchronously can decrease performance.
  const processAsyncMiddleware = async (
    value: T,
    attempt: number
  ): Promise<T> => {
    let currentValue = value;

    for (let i = 0; i < middlewares.length; i++) {
      try {
        const result = middlewares[i](currentValue);
        currentValue = await result;
      } catch (error) {
        if (attempt < retries) {
          return scheduleRetry(attempt, value);
        }
        errorHandler(error);
        throw error;
      }
    }

    return currentValue;
  };

  const isPromise = (value: any): boolean => {
    return value && typeof value.then === 'function';
  };

  const applyMiddleware = (value: T, attempt: number = 0): T | Promise<T> => {
    if (middlewares.length === 0) {
      return value;
    }

    if (attempt === 0 && retries === 0) {
      try {
        const firstResult = middlewares[0](value);

        if (!isPromise(firstResult)) {
          let currentValue = firstResult as T;
          for (let i = 1; i < middlewares.length; i++) {
            const result = middlewares[i](currentValue);
            if (isPromise(result)) {
              return Promise.resolve(firstResult).then(() =>
                processAsyncMiddleware(value, attempt)
              );
            }
            currentValue = result as T;
          }
          return currentValue;
        }
      } catch (error) {
        errorHandler(error);
        throw error;
      }
    }
    return processAsyncMiddleware(value, attempt);
  };

  return { applyMiddleware };
};
