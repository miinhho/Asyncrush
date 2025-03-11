import { RushStream } from '../core';
import { RushOptions } from '../types';
/**
 * Creates a stream from Node.js EventEmitter events
 * @param emitter EventEmitter instance
 * @param eventName Event name to listen for
 * @param options Stream configuration options
 * @returns A stream of emitter events
 */
export declare const fromEmitter: <T>(emitter: {
    on: Function;
    off: Function;
}, eventName: string, options?: RushOptions<T>) => RushStream<T>;
