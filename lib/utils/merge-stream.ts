import { RushStream } from '../core';
import { RushOptions } from '../types';
import { createStream } from './create-stream';

/**
 * Creates a stream that merges multiple source streams
 * @param streams Source streams to merge
 * @param options Configuration options
 * @returns A stream that emits values from all source streams
 */
export function mergeStreams<T>(
  streams: RushStream<T>[],
  options: RushOptions<T> = {}
): RushStream<T> {
  return createStream<T>((observer) => {
    if (streams.length === 0) {
      observer.complete();
      return;
    }

    let completedCount = 0;
    const subscriptions = streams.map((stream) =>
      stream.listen({
        next: (value) => observer.next(value),
        error: (error) => observer.error(error),
        complete: () => {
          completedCount++;
          if (completedCount === streams.length) {
            observer.complete();
          }
        },
      })
    );

    return () => {
      subscriptions.forEach((subscription) => subscription.unlisten());
    };
  }, options);
}
