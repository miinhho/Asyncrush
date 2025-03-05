import EventEmitter from "node:events";
import { RushStream } from "../";
export declare function streamFromTarget<T = any | any[]>(target: EventTarget, eventName: string, options?: AddEventListenerOptions): RushStream<T>;
export declare function streamFromEvent<T = any | any[]>(target: EventEmitter, eventName: string): RushStream<T>;
