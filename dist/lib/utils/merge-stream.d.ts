import { RushStream } from '../core';
import { RushOptions } from '../types';
/**
 * Creates a stream that merges multiple source streams
 * @param streams Source streams to merge
 * @param options Configuration options
 * @returns A stream that emits values from all source streams
 */
export declare function mergeStreams<T>(streams: RushStream<T>[], options?: RushOptions<T>): RushStream<T>;
