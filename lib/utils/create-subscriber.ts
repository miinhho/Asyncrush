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
    useObjectPool: options.useObjectPool ?? true,
    ...(options.useObjectPool !== false && {
      poolConfig: {
        initialSize: options.poolConfig?.initialSize ?? 10,
        maxSize: options.poolConfig?.maxSize ?? 50,
      },
    }),

    ...(options.backpressure !== null && {
      backpressure: {
        highWatermark: options.backpressure?.highWatermark ?? 500,
        lowWatermark: options.backpressure?.lowWatermark ?? 100,
        mode: options.backpressure?.mode ?? BackpressureMode.WAIT,
        waitTimeout: options.backpressure?.waitTimeout ?? 30000,
      },
    }),

    continueOnError: options.continueOnError,
    maxBufferSize: options.maxBufferSize,
    debugHook: options.debugHook,
  };

  return new RushSubscriber<T>(enhancedOptions);
}
