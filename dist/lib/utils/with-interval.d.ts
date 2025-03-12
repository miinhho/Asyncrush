import { RushStream } from '../core';
import { RushOptions } from '../types';
export declare function withInterval<T>(intervalMs: number, valueOrGenerator: T, options?: RushOptions<T> & {
    count?: number;
}): RushStream<T>;
export declare function withInterval<T>(intervalMs: number, valueOrGenerator: (count: number) => T, options?: RushOptions<T> & {
    count?: number;
}): RushStream<T>;
