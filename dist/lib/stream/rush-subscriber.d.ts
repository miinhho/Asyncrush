import { RushObserver } from "../observer/rush-observer";
import { RushMiddleware } from "../types";
import { RushStream } from "./rush-stream";
export declare class RushSubscriber<T = any> extends RushObserver<T> {
    /** Reference to the stream */
    stream?: RushStream<T>;
    /**
     * Creates a new RushSubscriber instance
     * @param options - Whether to continue on error
     */
    constructor(options?: {
        continueOnError?: boolean;
    });
    /**
     * Subscribes to a stream
     * @param stream - Stream to subscribe
     */
    subscribe(stream: RushStream<T>): this;
    /**
     * Applies middleware to transform events with retry logic
     * @param args - Middleware functions
     */
    use(...middlewares: RushMiddleware<T, T>[]): RushSubscriber<T>;
    /** Unsubscribes from the stream and clear buffer */
    unsubscribe(): this;
    /** Destroy the subscriber */
    destroy(): void;
}
