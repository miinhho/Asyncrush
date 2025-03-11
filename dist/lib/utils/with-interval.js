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
exports.withInterval = void 0;
const create_stream_1 = require("./create-stream");
/**
 * Creates a stream that emits values at fixed time intervals
 * @param intervalMs Interval in milliseconds
 * @param valueOrGenerator Value or generator function
 * @param options Configuration options including count limit
 * @returns A stream that emits at the specified interval
 */
const withInterval = (intervalMs, valueOrGenerator, options = {}) => {
    const { count } = options, streamOptions = __rest(options, ["count"]);
    const generator = typeof valueOrGenerator === 'function'
        ? valueOrGenerator
        : () => valueOrGenerator;
    return (0, create_stream_1.createStream)((observer) => {
        let counter = 0;
        const timer = setInterval(() => {
            try {
                const value = generator(counter);
                observer.next(value);
                counter += 1;
                if (count && counter >= count) {
                    clearInterval(timer);
                    observer.complete();
                }
            }
            catch (error) {
                observer.error(error);
                clearInterval(timer);
            }
        }, intervalMs);
        return () => clearInterval(timer);
    }, streamOptions);
};
exports.withInterval = withInterval;
