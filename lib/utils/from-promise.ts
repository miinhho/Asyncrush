import { RushStream } from '../core';
import { RushOptions } from '../types';
import { createStream } from './create-stream';

/**
 * Creates a stream from a Promise or async function
 * @param promiseOrFn Promise or function returning a promise
 * @param options Configuration options
 * @returns A stream that emits the resolved value
 */
export const fromPromise = <T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  options: RushOptions<T> = {}
): RushStream<T> => {
  return createStream<T>((observer) => {
    const promise =
      typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;

    promise
      .then((value) => {
        observer.next(value);
        observer.complete();
      })
      .catch((error) => observer.error(error));
  }, options);
};
