"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamFromTarget = streamFromTarget;
exports.streamFromEvent = streamFromEvent;
const __1 = require("../");
function streamFromTarget(target, eventName, options = {}) {
    return new __1.RushStream((observer) => {
        const eventHandler = (...args) => observer.next((args.length > 1 ? args : args[0]));
        target.addEventListener(eventName, eventHandler, options);
        return () => target.removeEventListener(eventName, eventHandler, options);
    });
}
function streamFromEvent(target, eventName) {
    return new __1.RushStream((observer) => {
        const eventHandler = (...args) => observer.next((args.length > 1 ? args : args[0]));
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
