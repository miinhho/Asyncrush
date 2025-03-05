import EventEmitter from "node:events";
import { RushStream } from "../";
export declare function streamFromTarget<T extends Event>(target: EventTarget, eventName: string, options?: EventListenerOptions): RushStream<T>;
export declare function streamFromEvent<T = any | any[]>(target: EventEmitter, eventName: string): RushStream<T>;
