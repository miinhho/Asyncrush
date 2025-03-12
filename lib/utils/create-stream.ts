import { RushObserver, RushStream } from '../core';
import { BackpressureMode } from '../manager';
import { RushOptions } from '../types';

/**
 * Creates an optimized stream with performance enhancements
 * @param producer Function that emits events
 * @param options Configuration options
 * @returns An optimized RushStream instance
 */
export const createStream = <T>(
  producer:
    | ((observer: RushObserver<T>) => void)
    | ((observer: RushObserver<T>) => () => void),
  options: RushOptions<T> = {}
): RushStream<T> => {
  const enhancedOptions: RushOptions<T> = {
    ...(options.backpressure !== null && {
      backpressure: {
        highWatermark: options.backpressure?.highWatermark ?? 100,
        lowWatermark: options.backpressure?.lowWatermark ?? 20,
        mode: options.backpressure?.mode ?? BackpressureMode.NOTIFY,
        waitTimeout: options.backpressure?.waitTimeout ?? 3000,
      },
    }),

    continueOnError: options.continueOnError,
    debugHook: options.debugHook,
    eventTargets: options.eventTargets,
  };

  return new RushStream<T>(producer, enhancedOptions);
};
