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
  // Apply default optimization settings
  const enhancedOptions: RushOptions<T> = {
    // Enable object pooling by default
    useObjectPool: options.useObjectPool ?? true,

    // Configure object pool if enabled
    ...(options.useObjectPool !== false && {
      poolConfig: {
        initialSize: options.poolConfig?.initialSize ?? 10,
        maxSize: options.poolConfig?.maxSize ?? 50,
      },
    }),

    // Configure backpressure if not explicitly disabled
    ...(options.backpressure !== null && {
      backpressure: {
        highWatermark: options.backpressure?.highWatermark ?? 500,
        lowWatermark: options.backpressure?.lowWatermark ?? 100,
        mode: options.backpressure?.mode ?? BackpressureMode.WAIT,
        waitTimeout: options.backpressure?.waitTimeout ?? 30000,
      },
    }),

    // Pass through other options
    continueOnError: options.continueOnError,
    maxBufferSize: options.maxBufferSize,
    debugHook: options.debugHook,
  };

  return new RushSubscriber<T>(enhancedOptions);
}
