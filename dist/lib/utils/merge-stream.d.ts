import { RushStream } from "../stream/rush-stream";
/**
 * Merges multiple streams into a single stream
 * @param streams - The streams to merge
 */
export declare const mergeStream: <T>(...streams: RushStream<T>[]) => RushStream<T>;
