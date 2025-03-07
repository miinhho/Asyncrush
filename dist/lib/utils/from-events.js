"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamFromEvents = exports.streamFromEvent = exports.streamFromTargets = exports.streamFromTarget = void 0;
const __1 = require("../");
/**
 * Creates a RushStream from a single EventTarget.
 * @param target - The EventTarget to listen to.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 * @param streamOptions - Options for the RushStream.
 */
const streamFromTarget = (target, eventName, options = {}, streamOptions = {}) => new __1.RushStream((observer) => {
    const eventHandler = (event) => observer.next(event);
    target.addEventListener(eventName, eventHandler, options);
    return () => target.removeEventListener(eventName, eventHandler, options);
}, Object.assign({}, streamOptions));
exports.streamFromTarget = streamFromTarget;
/**
 * Creates a RushStream from multiple EventTargets.
 * @param targets - An array or NodeList of EventTargets to listen to.
 * @param eventName - The name of the event to listen for.
 * @param options - Options for the event listeners.
 * @param streamOptions - Options for the RushStream.
 */
const streamFromTargets = (targets, eventName, options = {}, streamOptions = {}) => new __1.RushStream((observer) => {
    const eventHandler = (event) => observer.next(event);
    const listeners = new Map();
    Array.from(targets).forEach((target) => {
        target.addEventListener(eventName, eventHandler, options);
        listeners.set(target, eventHandler);
    });
    return () => {
        listeners.forEach((handler, target) => target.removeEventListener(eventName, handler, options));
        listeners.clear();
    };
}, Object.assign({}, streamOptions));
exports.streamFromTargets = streamFromTargets;
/**
 * Creates a RushStream from a single EventEmitter.
 * @param target - The EventEmitter to listen to.
 * @param eventName - The name of the event to listen for.
 * @param streamOptions - Options for the RushStream.
 */
const streamFromEvent = (target, eventName, streamOptions = {}) => {
    const stream = new __1.RushStream((observer) => {
        const eventHandler = (...args) => observer.next((args.length > 1 ? args : args[0]));
        const endHandler = () => {
            observer.complete.bind(observer)();
            stream.unlisten('complete');
        };
        const errorHandler = (err) => {
            observer.error.bind(observer)(err);
            if (!!streamOptions.continueOnError)
                stream.unlisten('destroy');
        };
        target.on(eventName, eventHandler);
        target.on('end', endHandler);
        target.on('error', errorHandler);
        return () => {
            target.off(eventName, eventHandler);
            target.off('end', endHandler);
            target.off('error', errorHandler);
        };
    }, Object.assign({}, streamOptions));
    return stream;
};
exports.streamFromEvent = streamFromEvent;
/**
 * Creates a RushStream from multiple EventEmitter.
 * @param targets - An array of EventEmitters to listen to.
 * @param eventName - The name of the event to listen for.
 * @param streamOptions - Options for the RushStream.
 */
const streamFromEvents = (targets, eventName, streamOptions = {}) => {
    const stream = new __1.RushStream((observer) => {
        const eventHandler = (...args) => observer.next((args.length > 1 ? args : args[0]));
        const endHandler = () => {
            observer.complete.bind(observer)();
            stream.unlisten('complete');
        };
        const errorHandler = (err) => {
            observer.error.bind(observer)(err);
            if (!!streamOptions.continueOnError)
                stream.unlisten('destroy');
        };
        const listeners = new Map();
        targets.forEach((target) => {
            target.on(eventName, eventHandler);
            target.on('end', endHandler);
            target.on('error', errorHandler);
            listeners.set(target, [eventHandler, endHandler, errorHandler]);
        });
        return () => {
            listeners.forEach((handlers, target) => {
                target.off(eventName, handlers[0]);
                target.off('end', handlers[1]);
                target.off('error', handlers[2]);
            });
            listeners.clear();
        };
    }, Object.assign({}, streamOptions));
    return stream;
};
exports.streamFromEvents = streamFromEvents;
