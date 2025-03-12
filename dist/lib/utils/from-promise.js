"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromPromise = fromPromise;
const create_stream_1 = require("./create-stream");
/**
 * Creates a stream from a Promise or async function
 * @param promiseOrFn Promise or function returning a promise
 * @param options Configuration options
 * @returns A stream that emits the resolved value
 */
function fromPromise(promiseOrFn, options = {}) {
    return (0, create_stream_1.createStream)((observer) => {
        const promise = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
        promise
            .then((value) => {
            observer.next(value);
            observer.complete();
        })
            .catch((error) => observer.error(error));
    }, options);
}
