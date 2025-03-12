import { RushStream } from '../core';
import { RushOptions } from '../types';
import { createStream } from './create-stream';

export function fromDOMEvent<T extends Event>(
  target: EventTarget,
  eventName: string,
  options?: RushOptions<T> & AddEventListenerOptions
): RushStream<T>;

export function fromDOMEvent<T extends Event>(
  target: EventTarget[],
  eventName: string,
  options?: RushOptions<T> & AddEventListenerOptions
): RushStream<T>;

/**
 * Creates a stream from DOM events
 * @param target DOM element or elements to listen to
 * @param eventName Event name to listen for
 * @param options Listener and stream options
 * @returns A stream of DOM events
 */
export function fromDOMEvent<T extends Event>(
  target: EventTarget | EventTarget[],
  eventName: string,
  options: RushOptions<T> & AddEventListenerOptions = {}
): RushStream<T> {
  const { passive, capture, once, signal, ...streamOptions } = options;
  const listenerOptions = { passive, capture, once, signal };

  const targets = Array.isArray(target) ? target : [target];
  const enhancedOptions: RushOptions<T> = {
    ...streamOptions,
    eventTargets: [...(streamOptions.eventTargets || []), ...targets],
  };

  return createStream<T>((observer) => {
    const eventHandler = (event: Event) => observer.next(event as T);

    targets.forEach((target) => {
      target.addEventListener(eventName, eventHandler, listenerOptions);
    });

    return () => {
      targets.forEach((target) => {
        target.removeEventListener(eventName, eventHandler, listenerOptions);
      });
    };
  }, enhancedOptions);
}
