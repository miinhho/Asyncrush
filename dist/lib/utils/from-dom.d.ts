import { RushStream } from '../core';
import { RushOptions } from '../types';
/**
 * Creates a stream from DOM events
 * @param target DOM element or elements to listen to
 * @param eventName Event name to listen for
 * @param options Listener and stream options
 * @returns A stream of DOM events
 */
export declare function fromDOMEvent<T extends Event>(target: EventTarget | EventTarget[], eventName: string, options?: RushOptions<T> & AddEventListenerOptions): RushStream<T>;
