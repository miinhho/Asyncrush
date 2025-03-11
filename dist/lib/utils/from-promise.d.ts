import { RushStream } from '../core';
import { RushOptions } from '../types';
/**
 * Creates a stream from a Promise or async function
 * @param promiseOrFn Promise or function returning a promise
 * @param options Configuration options
 * @returns A stream that emits the resolved value
 */
export declare const fromPromise: <T>(promiseOrFn: Promise<T> | (() => Promise<T>), options?: RushOptions<T>) => RushStream<T>;
