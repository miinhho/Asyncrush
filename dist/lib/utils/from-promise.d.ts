import { RushStream } from '../core';
import { RushOptions } from '../types';
export declare function fromPromise<T>(promiseOrFn: Promise<T>, options?: RushOptions<T>): RushStream<T>;
export declare function fromPromise<T>(promiseOrFn: () => Promise<T>, options?: RushOptions<T>): RushStream<T>;
