"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeStream = void 0;
const rush_stream_1 = require("../stream/rush-stream");
/**
 * Merges multiple streams into a single stream
 * @param streams - The streams to merge
 */
const mergeStream = (...streams) => {
    return new rush_stream_1.RushStream((observer) => {
        let completedStreams = 0;
        const streamBundle = streams.map((stream) => {
            return stream.listen(({
                next: (value) => observer.next(value),
                error: (error) => observer.error(error),
                complete: () => {
                    completedStreams++;
                    if (completedStreams === streams.length)
                        observer.complete();
                }
            }));
        });
        return () => streamBundle.forEach((stream) => stream.unlisten());
    });
};
exports.mergeStream = mergeStream;
