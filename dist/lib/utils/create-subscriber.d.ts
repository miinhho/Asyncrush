import { RushSubscriber } from '../core';
import { RushOptions } from '../types';
/**
 * Creates an optimized subscriber with performance enhancements
 * @param options Configuration options
 * @returns An optimized RushSubscriber instance
 */
export declare function createSubscriber<T>(options?: RushOptions<T>): RushSubscriber<T>;
