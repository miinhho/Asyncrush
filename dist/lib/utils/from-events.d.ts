import EventEmitter from "node:events";
import { RushStream } from "../";
/**
 * Creates a RushStream from a single EventTarget.
 * @param target - The EventTarget to listen to.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 */
export declare function streamFromTarget<T>(target: EventTarget, eventName: string, options?: AddEventListenerOptions): RushStream<T>;
/**
 * Creates a RushStream from multiple EventTargets.
 * @param targets - An array or NodeList of EventTargets to listen to.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 */
export declare function streamFromTargets<T extends Event>(targets: EventTarget[] | NodeList, eventName: string, options?: AddEventListenerOptions): RushStream<T>;
/**
 * Creates a RushStream from dynamically changing DOM elements
 * that match a selector, updating listeners as the DOM changes.
 * @param parent - The parent element to watch for changes.
 * @param selector - The selector to match target elements.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 */
export declare function streamFromDynamicTargets<T>(parent: HTMLElement, selector: string, eventName: string, options?: AddEventListenerOptions): RushStream<T>;
/**
 * Creates a RushStream from a single EventEmitter.
 * @param target - The EventEmitter to listen to.
 * @param eventName - The name of the event to listen for.
 */
export declare function streamFromEvent<T = any | any[]>(target: EventEmitter, eventName: string): RushStream<T>;
/**
 * Creates a RushStream from multiple EventEmitter.
 * @param targets - An array of EventEmitters to listen to.
 * @param eventName - The name of the event to listen for.
 */
export declare function streamFromEvents<T = any | any[]>(targets: EventEmitter[], eventName: string): RushStream<T>;
