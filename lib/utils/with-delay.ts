import { RushStream } from '../core';
import { RushOptions } from '../types';
import { createStream } from './create-stream';

/**
 * Creates a timed delay between events in a stream
 * @param source Source stream
 * @param delayMs Delay in milliseconds
 * @param options Configuration options
 * @returns A stream with delayed events
 */
export const withDelay = <T>(
  source: RushStream<T>,
  delayMs: number,
  options: RushOptions<T> = {}
): RushStream<T> => {
  return createStream<T>((observer) => {
    const subscription = source.listen({
      next: (value) => {
        setTimeout(() => observer.next(value), delayMs);
      },
      error: (error) => observer.error(error),
      complete: () => {
        setTimeout(() => observer.complete(), delayMs);
      },
    });

    return () => subscription.unlisten();
  }, options);
};
