import EventEmitter from "node:events";
import { RushStream } from "../";

/**
 * Creates a RushStream from a single EventTarget.
 * @param target - The EventTarget to listen to.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 */
export function streamFromTarget<T>(
  target: EventTarget,
  eventName: string,
  options: AddEventListenerOptions = {}
): RushStream<T> {
  return new RushStream<T>((observer) => {
    const eventHandler = (...args: any[]) => observer.next((args.length > 1 ? args : args[0]) as T);
    target.addEventListener(eventName, eventHandler, options);
    return () => target.removeEventListener(eventName, eventHandler, options);
  });
}

/**
 * Creates a RushStream from multiple EventTargets.
 * @param targets - An array or NodeList of EventTargets to listen to.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 */
export function streamFromTargets<T extends Event>(
  targets: EventTarget[] | NodeList,
  eventName: string,
  options: AddEventListenerOptions = {}
): RushStream<T> {
  return new RushStream<T>((observer) => {
    const eventHandler = (...args: any[]) => observer.next((args.length > 1 ? args : args[0]) as T);

    const listeners = new Map<EventTarget, EventListener>();
    Array.from(targets).forEach((target) => {
      target.addEventListener(eventName, eventHandler, options);
      listeners.set(target, eventHandler);
    });

    return () => {
      listeners.forEach(
        (handler, target) => target.removeEventListener(eventName, handler, options)
      );
      listeners.clear();
    };
  });
}

/**
 * Creates a RushStream from dynamically changing DOM elements
 * that match a selector, updating listeners as the DOM changes.
 * @param parent - The parent element to watch for changes.
 * @param selector - The selector to match target elements.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 */
export function streamFromDynamicTargets<T>(
  parent: HTMLElement,
  selector: string,
  eventName: string,
  options: AddEventListenerOptions = {}
): RushStream<T> {
  return new RushStream<T>((observer) => {
    const eventHandler = (...args: any[]) => observer.next((args.length > 1 ? args : args[0]) as T);

    const listeners = new Map<EventTarget, EventListener>();

    const updateTargets = () => {
      const targets = parent.querySelectorAll(selector);
      listeners.forEach((handler, target) => {
        target.removeEventListener(eventName, handler, options);
      });

      listeners.clear();
      targets.forEach((target) => {
        target.addEventListener(eventName, eventHandler, options);
        listeners.set(target, eventHandler);
      });
    };

    updateTargets();
    const mutationObserver = new MutationObserver(() => updateTargets());
    mutationObserver.observe(parent, { childList: true, subtree: true });

    return () => {
      listeners.forEach((handler, target) =>
        target.removeEventListener(eventName, handler, options)
      );
      listeners.clear();
      mutationObserver.disconnect();
    };
  });
}

/**
 * Creates a RushStream from a single EventEmitter.
 * @param target - The EventEmitter to listen to.
 * @param eventName - The name of the event to listen for.
 */
export function streamFromEvent<T = any | any[]>(
  target: EventEmitter,
  eventName: string,
): RushStream<T> {
  return new RushStream<T>((observer) => {
    const eventHandler = (...args: any[]) => observer.next((args.length > 1 ? args : args[0]) as T);

    const endHandler = observer.complete.bind(observer);
    const errorHandler = observer.error.bind(observer);

    target.on(eventName, eventHandler);
    target.on('error', errorHandler);
    target.on('end', endHandler);

    return () => {
      target.off(eventName, eventHandler);
      target.off('error', errorHandler);
      target.off('end', endHandler);
    };
  });
}

/**
 * Creates a RushStream from multiple EventEmitter.
 * @param targets - An array of EventEmitters to listen to.
 * @param eventName - The name of the event to listen for.
 */
export function streamFromEvents<T = any | any[]>(
  targets: EventEmitter[],
  eventName: string
): RushStream<T> {
  return new RushStream<T>((observer) => {
    const eventHandler = (...args: any[]) => observer.next((args.length > 1 ? args : args[0]) as T);

    const endHandler = observer.complete.bind(observer);
    const errorHandler = observer.error.bind(observer);

    const listeners = new Map<EventEmitter, ((...args: any[]) => void)[]>();
    targets.forEach((target) => {
      target.on(eventName, eventHandler);
      target.on("end", endHandler);
      target.on("error", errorHandler);
      listeners.set(target, [eventHandler, endHandler, errorHandler]);
    });

    return () => {
      listeners.forEach((handlers, target) => {
        target.off(eventName, handlers[0]);
        target.off("end", handlers[1]);
        target.off("error", handlers[2]);
      });
      listeners.clear();
    };
  });
}
