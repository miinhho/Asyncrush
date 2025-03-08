import { RushStream } from '../core';
import { RushOptions } from '../types';
import { createStream } from './create-stream';

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

  // Add targets to eventTargets for automatic cleanup
  const targets = Array.isArray(target) ? target : [target];
  const enhancedOptions: RushOptions<T> = {
    ...streamOptions,
    eventTargets: [...(streamOptions.eventTargets || []), ...targets],
  };

  return createStream<T>((observer) => {
    const eventHandler = (event: Event) => observer.next(event as T);

    // Add event listeners to all targets
    targets.forEach((target) => {
      target.addEventListener(eventName, eventHandler, listenerOptions);
    });

    // Return cleanup function
    return () => {
      targets.forEach((target) => {
        target.removeEventListener(eventName, eventHandler, listenerOptions);
      });
    };
  }, enhancedOptions);
}
