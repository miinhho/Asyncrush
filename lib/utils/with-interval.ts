import { RushStream } from '../core';
import { RushOptions } from '../types';
import { createStream } from './create-stream';

/**
 * Creates a stream that emits values at fixed time intervals
 * @param intervalMs Interval in milliseconds
 * @param valueOrGenerator Value or generator function
 * @param options Configuration options including count limit
 * @returns A stream that emits at the specified interval
 */
export const withInterval = <T>(
  intervalMs: number,
  valueOrGenerator: T | ((count: number) => T),
  options: RushOptions<T> & { count?: number } = {}
): RushStream<T> => {
  const { count, ...streamOptions } = options;
  const generator =
    typeof valueOrGenerator === 'function'
      ? (valueOrGenerator as (count: number) => T)
      : () => valueOrGenerator;

  return createStream<T>((observer) => {
    let counter = 0;
    const timer = setInterval(() => {
      try {
        const value = generator(counter);
        observer.next(value);
        counter += 1;

        if (count && counter >= count) {
          clearInterval(timer);
          observer.complete();
        }
      } catch (error) {
        observer.error(error);
        clearInterval(timer);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, streamOptions);
};
