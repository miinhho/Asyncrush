import { RushStream } from '../core';
import { RushOptions } from '../types';
/**
 * Creates a stream that combines latest values from multiple streams
 * @param streams Source streams
 * @param combiner Function to combine the latest values
 * @param options Configuration options
 * @returns A stream emitting combined values
 */
export declare const combineLatest: <T, R>(streams: RushStream<T>[], combiner: (...values: T[]) => R, options?: RushOptions<R>) => RushStream<R>;
