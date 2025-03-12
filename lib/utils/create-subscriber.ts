import { RushSubscriber } from '../core';
import { BackpressureMode } from '../manager';
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
      backpressure: {
        mode: options.backpressure?.mode ?? BackpressureMode.WAIT,
      },
    }),

    continueOnError: options.continueOnError,
    debugHook: options.debugHook,
  };

  return new RushSubscriber<T>(enhancedOptions);
}
