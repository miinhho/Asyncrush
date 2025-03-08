import { RushStream } from '../core';
import { RushOptions } from '../types';
/**
 * Creates a buffered stream that collects events and emits them as arrays
 * @param source Source stream
 * @param options Buffering configuration
 * @returns A stream emitting buffered arrays of values
 */
export declare function withBuffer<T>(source: RushStream<T>, options: {
    count?: number;
    timeMs?: number;
    flushOnComplete?: boolean;
} & RushOptions<T[]>): RushStream<T[]>;
