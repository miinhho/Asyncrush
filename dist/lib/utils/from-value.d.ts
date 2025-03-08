import { RushStream } from '../core';
import { RushOptions } from '../types';
/**
 * Creates a stream from an array of values
 * @param values The values to emit
 * @param options Configuration options including interval timing
 * @returns A stream that emits the provided values
 */
export declare function fromValues<T>(values: T[], options?: RushOptions<T> & {
    interval?: number;
}): RushStream<T>;
