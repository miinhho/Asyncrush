import { RushObserver } from "../observer/rush-observer";
import { RushMiddleware, RushSubscriberOption } from "../types";
import { RushStream } from "./rush-stream";
export declare class RushSubscriber<T = any> extends RushObserver<T> {
    /** Reference to the stream */
    stream?: RushStream<T>;
    /** Flag to pause the subscriber */
    private isPaused;
    /** Maximum buffer size */
    private maxBufferSize;
    /** Buffer for paused events */
    private buffer;
    /**
     * Creates a new RushSubscriber instance
     * @param options - Whether to continue on error
     */
    constructor(options?: {
        continueOnError?: boolean;
        maxBufferSize?: number;
    });
    /** Emits a value to all chained 'next' handlers */
    next(value: T): void;
    onComplete(handler: () => void): this;
    onError(handler: (err: unknown) => void): this;
    /**
     * Subscribes to a stream
     * @param stream - Stream to subscribe
     */
    subscribe(stream: RushStream<T>): this;
    /**
     * Applies middleware to transform events with retry logic
     * @param args - Middleware functions
     */
    use(...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushSubscriberOption]): RushSubscriber<T>;
    /**
     * Helper method to wrap middleware with retry logic
     * @param args - Middleware functions or array with options
    */
    private retryWrapper;
    /** Unsubscribes from the stream and clear buffer */
    unsubscribe(): this;
    /** Pauses the subscriber, buffering events if enabled */
    pause(): this;
    /** Resumes the stream, flushing buffered events */
    resume(): this;
    /** Destroy the subscriber */
    destroy(): void;
}
