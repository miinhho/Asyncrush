"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromEmitter = void 0;
const create_stream_1 = require("./create-stream");
/**
 * Creates a stream from Node.js EventEmitter events
 * @param emitter EventEmitter instance
 * @param eventName Event name to listen for
 * @param options Stream configuration options
 * @returns A stream of emitter events
 */
const fromEmitter = (emitter, eventName, options = {}) => {
    const enhancedOptions = Object.assign(Object.assign({}, options), { eventTargets: [...(options.eventTargets || []), emitter] });
    return (0, create_stream_1.createStream)((observer) => {
        const eventHandler = (...args) => observer.next((args.length > 1 ? args : args[0]));
        const errorHandler = (error) => {
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
exports.fromEmitter = fromEmitter;
