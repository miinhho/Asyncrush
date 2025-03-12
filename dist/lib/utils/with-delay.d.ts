import { RushStream } from '../core';
import { RushOptions } from '../types';
/**
 * Creates a timed delay between events in a stream
 * @param source Source stream
 * @param delayMs Delay in milliseconds
 * @param options Configuration options
 * @returns A stream with delayed events
 */
export declare function withDelay<T>(source: RushStream<T>, delayMs: number, options?: RushOptions<T>): RushStream<T>;
