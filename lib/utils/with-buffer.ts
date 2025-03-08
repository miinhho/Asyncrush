import { RushStream } from '../core';
import { RushOptions } from '../types';
import { createStream } from './create-stream';

/**
 * Creates a buffered stream that collects events and emits them as arrays
 * @param source Source stream
 * @param options Buffering configuration
 * @returns A stream emitting buffered arrays of values
 */
export function withBuffer<T>(
  source: RushStream<T>,
  options: {
    count?: number;
    timeMs?: number;
    flushOnComplete?: boolean;
  } & RushOptions<T[]>
): RushStream<T[]> {
  const { count, timeMs, flushOnComplete = true, ...streamOptions } = options;

  if (!count && !timeMs) {
    throw new Error('Either count or timeMs must be specified for buffer');
  }

  return createStream<T[]>((observer) => {
    let buffer: T[] = [];
    let timer: NodeJS.Timeout | null = null;

    // Function to emit buffered values
    const flush = () => {
      if (buffer.length > 0) {
        observer.next([...buffer]);
        buffer = [];
      }
    };

    // Set up timer if needed
    if (timeMs) {
      timer = setInterval(flush, timeMs);
    }

    const subscription = source.listen({
      next: (value) => {
        buffer.push(value);

        // If count-based buffer is full, emit
        if (count && buffer.length >= count) {
          flush();
        }
      },
      error: (error) => {
        if (timer) clearInterval(timer);
        observer.error(error);
      },
      complete: () => {
        if (timer) clearInterval(timer);

        // Emit any remaining buffered values
        if (flushOnComplete) {
          flush();
        }

        observer.complete();
      },
    });

    return () => {
      if (timer) clearInterval(timer);
      subscription.unlisten();
    };
  }, streamOptions);
}
