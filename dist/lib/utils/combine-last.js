"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineLatest = combineLatest;
const create_stream_1 = require("./create-stream");
/**
 * Creates a stream that combines latest values from multiple streams
 * @param streams Source streams
 * @param combiner Function to combine the latest values
 * @param options Configuration options
 * @returns A stream emitting combined values
 */
function combineLatest(streams, combiner, options = {}) {
    return (0, create_stream_1.createStream)((observer) => {
        if (streams.length === 0) {
            observer.complete();
            return;
        }
        const values = new Array(streams.length);
        const hasValue = new Array(streams.length).fill(false);
        let completedCount = 0;
        const subscriptions = streams.map((stream, index) => stream.listen({
            next: (value) => {
                values[index] = value;
                hasValue[index] = true;
                if (hasValue.every(Boolean)) {
                    try {
                        observer.next(combiner(...values));
                    }
                    catch (error) {
                        observer.error(error);
                    }
                }
            },
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
