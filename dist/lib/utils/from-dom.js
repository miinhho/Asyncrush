"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromDOMEvent = void 0;
const create_stream_1 = require("./create-stream");
/**
 * Creates a stream from DOM events
 * @param target DOM element or elements to listen to
 * @param eventName Event name to listen for
 * @param options Listener and stream options
 * @returns A stream of DOM events
 */
const fromDOMEvent = (target, eventName, options = {}) => {
    const { passive, capture, once, signal } = options, streamOptions = __rest(options, ["passive", "capture", "once", "signal"]);
    const listenerOptions = { passive, capture, once, signal };
    const targets = Array.isArray(target) ? target : [target];
    const enhancedOptions = Object.assign(Object.assign({}, streamOptions), { eventTargets: [...(streamOptions.eventTargets || []), ...targets] });
    return (0, create_stream_1.createStream)((observer) => {
        const eventHandler = (event) => observer.next(event);
        targets.forEach((target) => {
            target.addEventListener(eventName, eventHandler, listenerOptions);
        });
        return () => {
            targets.forEach((target) => {
                target.removeEventListener(eventName, eventHandler, listenerOptions);
            });
        };
    }, enhancedOptions);
};
exports.fromDOMEvent = fromDOMEvent;
