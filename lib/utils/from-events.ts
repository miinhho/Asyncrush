import EventEmitter from "node:events";
import { RushOptions, RushStream } from "../";

/**
 * Creates a RushStream from a single EventTarget.
 * @param target - The EventTarget to listen to.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 * @param streamOptions - Options for the RushStream.
 */
export const streamFromTarget = <T>(
  target: EventTarget,
  eventName: string,
  options: AddEventListenerOptions = {},
  streamOptions: RushOptions<T> = {}
): RushStream<T> => new RushStream<T>((observer) => {
  const eventHandler = (event: Event) => observer.next(event as T);
  target.addEventListener(eventName, eventHandler, options);
  return () => target.removeEventListener(eventName, eventHandler, options);
}, { ...streamOptions });

/**
 * Creates a RushStream from multiple EventTargets.
 * @param targets - An array or NodeList of EventTargets to listen to.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 * @param streamOptions - Options for the RushStream.
 */
export const streamFromTargets = <T extends Event>(
  targets: EventTarget[] | NodeList,
  eventName: string,
  options: AddEventListenerOptions = {},
  streamOptions: RushOptions<T> = {}
): RushStream<T> => new RushStream<T>((observer) => {
  const eventHandler = (event: Event) => observer.next(event as T);

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
}, { ...streamOptions });

/**
 * Creates a RushStream from a single EventEmitter.
 * @param target - The EventEmitter to listen to.
 * @param eventName - The name of the event to listen for.
 * @param streamOptions - Options for the RushStream.
 */
export const streamFromEvent = <T = any | any[]>(
  target: EventEmitter,
  eventName: string,
  streamOptions: RushOptions<T> = {}
): RushStream<T> => {
  const stream = new RushStream<T>((observer) => {
    const eventHandler = (...args: any[]) => observer.next((args.length > 1 ? args : args[0]) as T);

    const endHandler = () => {
      observer.complete.bind(observer)();
      stream.unlisten('complete');
    };
    const errorHandler = (err: unknown) => {
      observer.error.bind(observer)(err);
      if (!!streamOptions.continueOnError) stream.unlisten('destroy');
    };

    target.on(eventName, eventHandler);
    target.on('end', endHandler);
    target.on('error', errorHandler);

    return () => {
      target.off(eventName, eventHandler);
      target.off('error', errorHandler);
      target.off('end', endHandler);
    };
  }, { ...streamOptions });

  return stream;
}

/**
 * Creates a RushStream from multiple EventEmitter.
 * @param targets - An array of EventEmitters to listen to.
 * @param eventName - The name of the event to listen for.
 * @param streamOptions - Options for the RushStream.
 */
export const streamFromEvents = <T = any | any[]>(
  targets: EventEmitter[],
  eventName: string,
  streamOptions: RushOptions<T> = {}
): RushStream<T> => {
  const stream = new RushStream<T>((observer) => {
    const eventHandler = (...args: any[]) => observer.next((args.length > 1 ? args : args[0]) as T);

    const endHandler = () => {
      observer.complete.bind(observer)();
      stream.unlisten('complete');
    };
    const errorHandler = (err: unknown) => {
      observer.error.bind(observer)(err);
      if (!!streamOptions.continueOnError) stream.unlisten('destroy');
    };

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
        target.off("error", handlers[2]);
        target.off("end", handlers[1]);
      });
      listeners.clear();
    };
  }, { ...streamOptions });

  return stream;
}
