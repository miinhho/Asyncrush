import { RushSubscriber } from '../core';
import { DEFAULT_BACKPRESSURE_OPTIONS } from '../manager';
import { RushOptions } from '../types';

/**
 * Creates an optimized subscriber with performance enhancements
 * @param options Configuration options
 * @returns An optimized RushSubscriber instance
 */
export function createSubscriber<T>(
  options: RushOptions<T> = {}
): RushSubscriber<T> {
  const enhancedOptions: RushOptions<T> = {
    ...(options.backpressure !== null && {
      backpressure: DEFAULT_BACKPRESSURE_OPTIONS,
    }),

    continueOnError: options.continueOnError,
    debugHook: options.debugHook,
  };

  return new RushSubscriber<T>(enhancedOptions);
}
