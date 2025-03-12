import { RushStream } from '../core';
import { RushOptions } from '../types';
export declare function fromDOMEvent<T extends Event>(target: EventTarget, eventName: string, options?: RushOptions<T> & AddEventListenerOptions): RushStream<T>;
export declare function fromDOMEvent<T extends Event>(target: EventTarget[], eventName: string, options?: RushOptions<T> & AddEventListenerOptions): RushStream<T>;
