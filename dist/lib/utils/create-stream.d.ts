import { RushObserver, RushStream } from '../core';
import { RushOptions } from '../types';
/**
 * Creates an optimized stream with performance enhancements
 * @param producer Function that emits events
 * @param options Configuration options
 * @returns An optimized RushStream instance
 */
export declare function createStream<T>(producer: ((observer: RushObserver<T>) => void) | ((observer: RushObserver<T>) => () => void), options?: RushOptions<T>): RushStream<T>;
