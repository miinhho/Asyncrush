import { RushStream } from '../core';
import { RushOptions } from '../types';
import { createStream } from './create-stream';

/**
 * Creates a stream from Node.js EventEmitter events
 * @param emitter EventEmitter instance
 * @param eventName Event name to listen for
 * @param options Stream configuration options
 * @returns A stream of emitter events
 */
export const fromEmitter = <T>(
  emitter: { on: Function; off: Function },
  eventName: string,
  options: RushOptions<T> = {}
): RushStream<T> => {
  const enhancedOptions: RushOptions<T> = {
    ...options,
    eventTargets: [...(options.eventTargets || []), emitter],
  };

  return createStream<T>((observer) => {
    const eventHandler = (...args: any[]) =>
      observer.next((args.length > 1 ? args : args[0]) as T);

    const errorHandler = (error: unknown) => {
      observer.error(error);
      if (enhancedOptions.continueOnError !== true) {
        observer.complete();
      }
    };

    const endHandler = () => {
      observer.complete();
    };

    emitter.on(eventName, eventHandler);
    emitter.on('error', errorHandler);
    emitter.on('end', endHandler);

    return () => {
      emitter.off(eventName, eventHandler);
      emitter.off('error', errorHandler);
      emitter.off('end', endHandler);
    };
  }, enhancedOptions);
};
