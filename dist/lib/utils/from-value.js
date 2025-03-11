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
exports.fromValues = void 0;
const create_stream_1 = require("./create-stream");
/**
 * Creates a stream from an array of values
 * @param values The values to emit
 * @param options Configuration options including interval timing
 * @returns A stream that emits the provided values
 */
const fromValues = (values, options = {}) => {
    const { interval } = options, streamOptions = __rest(options, ["interval"]);
    return (0, create_stream_1.createStream)((observer) => {
        if (!values.length) {
            observer.complete();
            return;
        }
        if (interval && interval > 0) {
            let index = 0;
            const timer = setInterval(() => {
                if (index < values.length) {
                    observer.next(values[index++]);
                }
                else {
                    clearInterval(timer);
                    observer.complete();
                }
            }, interval);
            return () => clearInterval(timer);
        }
        else {
            values.forEach((value) => observer.next(value));
            observer.complete();
        }
    }, streamOptions);
};
exports.fromValues = fromValues;
