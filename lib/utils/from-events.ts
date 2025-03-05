import EventEmitter from "node:events";
import { RushStream } from "../";

export function streamFromTarget<T extends Event>(
  target: EventTarget,
  eventName: string,
  options: EventListenerOptions = {}
): RushStream<T> {
  return new RushStream<T>((observer) => {
    const eventHandler = (...args: any[]) => observer.next((args.length > 1 ? args : args[0]) as T);
    target.addEventListener(eventName, eventHandler, options);
    return () => target.removeEventListener(eventName, eventHandler, options);
  });
}

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
