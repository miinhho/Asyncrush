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
        highWatermark: options.backpressure?.highWatermark ?? 50,
        lowWatermark: options.backpressure?.lowWatermark ?? 10,
        mode: options.backpressure?.mode ?? BackpressureMode.WAIT,
        waitTimeout: options.backpressure?.waitTimeout ?? 3000,
      },
    }),

    continueOnError: options.continueOnError,
    debugHook: options.debugHook,
  };

  return new RushSubscriber<T>(enhancedOptions);
}
