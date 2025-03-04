import { RushOptions } from "lib/types";
import EventEmitter from "node:events";
import { RushStream } from "../";
/**
 * Creates a RushStream from a single EventTarget.
 * @param target - The EventTarget to listen to.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 */
export declare const streamFromTarget: <T>(target: EventTarget, eventName: string, options?: AddEventListenerOptions, streamOptions?: RushOptions<T>) => RushStream<T>;
/**
 * Creates a RushStream from multiple EventTargets.
 * @param targets - An array or NodeList of EventTargets to listen to.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 */
export declare const streamFromTargets: <T extends Event>(targets: EventTarget[] | NodeList, eventName: string, options?: AddEventListenerOptions, streamOptions?: RushOptions<T>) => RushStream<T>;
/**
 * Creates a RushStream from a single EventEmitter.
 * @param target - The EventEmitter to listen to.
 * @param eventName - The name of the event to listen for.
 */
export declare const streamFromEvent: <T = any>(target: EventEmitter, eventName: string, streamOptions?: RushOptions<T>) => RushStream<T>;
/**
 * Creates a RushStream from multiple EventEmitter.
 * @param targets - An array of EventEmitters to listen to.
 * @param eventName - The name of the event to listen for.
 */
export declare const streamFromEvents: <T = any>(targets: EventEmitter[], eventName: string, streamOptions?: RushOptions<T>) => RushStream<T>;
