import { RushStream } from '../core';
import { RushOptions } from '../types';
/**
 * Creates a stream that emits values at fixed time intervals
 * @param intervalMs Interval in milliseconds
 * @param valueOrGenerator Value or generator function
 * @param options Configuration options including count limit
 * @returns A stream that emits at the specified interval
 */
export declare const withInterval: <T>(intervalMs: number, valueOrGenerator: T | ((count: number) => T), options?: RushOptions<T> & {
    count?: number;
}) => RushStream<T>;
