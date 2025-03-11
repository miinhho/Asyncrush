import { RushStream } from '../core';
import { BackpressureMode } from '../manager';
/**
 * Sets backpressure configuration directly on a stream
 * @param stream Stream to configure
 * @param config Backpressure configuration
 * @returns The configured stream
 */
export declare const setBackpressure: <T>(stream: RushStream<T>, config: {
    highWatermark?: number;
    lowWatermark?: number;
    mode?: BackpressureMode;
}) => RushStream<T>;
