import { RushStream } from '../core';
import { RushOptions } from '../types';
import { createStream } from './create-stream';

/**
 * Creates a stream from an array of values
 * @param values The values to emit
 * @param options Configuration options including interval timing
 * @returns A stream that emits the provided values
 */
export function fromValues<T>(
  values: T[],
  options: RushOptions<T> & { interval?: number } = {}
): RushStream<T> {
  const { interval, ...streamOptions } = options;

  return createStream<T>((observer) => {
    if (!values.length) {
      observer.complete();
      return;
    }

    if (interval && interval > 0) {
      let index = 0;
      const timer = setInterval(() => {
        if (index < values.length) {
          observer.next(values[index++]);
        } else {
          clearInterval(timer);
          observer.complete();
        }
      }, interval);

      return () => clearInterval(timer);
    } else {
      // Emit all values immediately
      values.forEach((value) => observer.next(value));
      observer.complete();
    }
  }, streamOptions);
}
