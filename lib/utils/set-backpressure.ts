import { RushStream } from '../core';
import { BackpressureMode } from '../manager';

/**
 * Sets backpressure configuration directly on a stream
 * @param stream Stream to configure
 * @param config Backpressure configuration
 * @returns The configured stream
 */
export function setBackpressure<T>(
  stream: RushStream<T>,
  config: {
    highWatermark?: number;
    lowWatermark?: number;
    mode?: BackpressureMode;
  }
): RushStream<T> {
  // Access internal backpressure controller if available
  const controller = (stream as any).getBackpressureController?.();

  if (controller) {
    if (config.mode !== undefined) {
      controller.setMode(config.mode);
    }

    if (
      config.highWatermark !== undefined &&
      config.lowWatermark !== undefined
    ) {
      controller.setWatermarks(config.highWatermark, config.lowWatermark);
    }
  }

  return stream;
}
