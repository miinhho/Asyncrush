import { RushObserver, RushStream } from '../core';
import { DEFAULT_BACKPRESSURE_OPTIONS } from '../manager';
import { RushOptions } from '../types';

export function createStream<T>(
  producer: (observer: RushObserver<T>) => void,
  options?: RushOptions<T>
): RushStream<T>;

export function createStream<T>(
  producer: (observer: RushObserver<T>) => () => void,
  options?: RushOptions<T>
): RushStream<T>;

/**
 * Creates an optimized stream with performance enhancements
 * @param producer Function that emits events
 * @param options Configuration options
 * @returns An optimized RushStream instance
 */
export function createStream<T>(
  producer:
    | ((observer: RushObserver<T>) => void)
    | ((observer: RushObserver<T>) => () => void),
  options: RushOptions<T> = {}
): RushStream<T> {
  const enhancedOptions: RushOptions<T> = {
    ...(options.backpressure !== null && {
      backpressure: DEFAULT_BACKPRESSURE_OPTIONS,
    }),

    continueOnError: options.continueOnError,
    debugHook: options.debugHook,
    eventTargets: options.eventTargets,
  };

  return new RushStream<T>(producer, enhancedOptions);
}
