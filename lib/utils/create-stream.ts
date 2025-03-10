import { RushObserver, RushStream } from '../core';
import { BackpressureMode } from '../manager';
import { RushOptions } from '../types';

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
    useObjectPool: options.useObjectPool ?? true,
    ...(options.useObjectPool !== false && {
      poolConfig: {
        initialSize: options.poolConfig?.initialSize ?? 20,
        maxSize: options.poolConfig?.maxSize ?? 100,
      },
    }),

    ...(options.backpressure !== null && {
      backpressure: {
        highWatermark: options.backpressure?.highWatermark ?? 1000,
        lowWatermark: options.backpressure?.lowWatermark ?? 200,
        mode: options.backpressure?.mode ?? BackpressureMode.NOTIFY,
        waitTimeout: options.backpressure?.waitTimeout ?? 30000,
      },
    }),

    continueOnError: options.continueOnError,
    maxBufferSize: options.maxBufferSize,
    debugHook: options.debugHook,
    eventTargets: options.eventTargets,
  };

  return new RushStream<T>(producer, enhancedOptions);
}
