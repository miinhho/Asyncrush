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
exports.withBuffer = withBuffer;
const create_stream_1 = require("./create-stream");
/**
 * Creates a buffered stream that collects events and emits them as arrays
 * @param source Source stream
 * @param options Buffering configuration
 * @returns A stream emitting buffered arrays of values
 */
function withBuffer(source, options) {
    const { count, timeMs, flushOnComplete = true } = options, streamOptions = __rest(options, ["count", "timeMs", "flushOnComplete"]);
    if (!count && !timeMs) {
        throw new Error('Either count or timeMs must be specified for buffer');
    }
    return (0, create_stream_1.createStream)((observer) => {
        let buffer = [];
        let timer = null;
        const flush = () => {
            if (buffer.length > 0) {
                observer.next([...buffer]);
                buffer = [];
            }
        };
        if (timeMs) {
            timer = setInterval(flush, timeMs);
        }
        const subscription = source.listen({
            next: (value) => {
                buffer.push(value);
                if (count && buffer.length >= count) {
                    flush();
                }
            },
            error: (error) => {
                if (timer)
                    clearInterval(timer);
                observer.error(error);
            },
            complete: () => {
                if (timer)
                    clearInterval(timer);
                if (flushOnComplete) {
                    flush();
                }
                observer.complete();
            },
        });
        return () => {
            if (timer)
                clearInterval(timer);
            subscription.unlisten();
        };
    }, streamOptions);
}
