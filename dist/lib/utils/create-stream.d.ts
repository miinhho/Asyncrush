import { RushObserver, RushStream } from '../core';
import { RushOptions } from '../types';
export declare function createStream<T>(producer: (observer: RushObserver<T>) => void, options?: RushOptions<T>): RushStream<T>;
export declare function createStream<T>(producer: (observer: RushObserver<T>) => () => void, options?: RushOptions<T>): RushStream<T>;
