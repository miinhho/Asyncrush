"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDelay = withDelay;
const create_stream_1 = require("./create-stream");
/**
 * Creates a timed delay between events in a stream
 * @param source Source stream
 * @param delayMs Delay in milliseconds
 * @param options Configuration options
 * @returns A stream with delayed events
 */
function withDelay(source, delayMs, options = {}) {
    return (0, create_stream_1.createStream)((observer) => {
        const subscription = source.listen({
            next: (value) => {
                setTimeout(() => observer.next(value), delayMs);
            },
            error: (error) => observer.error(error),
            complete: () => {
                // Delay completion to ensure all events are processed
                setTimeout(() => observer.complete(), delayMs);
            },
        });
        return () => subscription.unlisten();
    }, options);
}
