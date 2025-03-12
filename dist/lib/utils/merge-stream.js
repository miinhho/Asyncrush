"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeStream = mergeStream;
const create_stream_1 = require("./create-stream");
/**
 * Creates a stream that merges multiple source streams
 * @param streams Source streams to merge
 * @param options Configuration options
 * @returns A stream that emits values from all source streams
 */
function mergeStream(streams, options = {}) {
    return (0, create_stream_1.createStream)((observer) => {
        if (streams.length === 0) {
            observer.complete();
            return;
        }
        let completedCount = 0;
        const subscriptions = streams.map((stream) => stream.listen({
            next: (value) => observer.next(value),
            error: (error) => observer.error(error),
            complete: () => {
                completedCount++;
                if (completedCount === streams.length) {
                    observer.complete();
                }
            },
        }));
        return () => {
            subscriptions.forEach((subscription) => subscription.unlisten());
        };
    }, options);
}
