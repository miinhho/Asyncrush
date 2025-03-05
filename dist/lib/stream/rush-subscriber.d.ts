import { RushDebugHook, RushMiddleware, RushObserver, RushStream, RushUseOption } from "../";
export declare class RushSubscriber<T = any> extends RushObserver<T> {
    /** Reference to the stream */
    stream?: RushStream<T>;
    /** Flag to pause the subscriber */
    private isPaused;
    /** Maximum buffer size */
    private maxBufferSize?;
    /** Buffer for paused events */
    private buffer?;
    /** Debugging hooks */
    private debugHook?;
    /**
     * Creates a new RushSubscriber instance
     * @param options - Whether to continue on error
     */
    constructor(options?: {
        continueOnError?: boolean;
        maxBufferSize?: number;
        debugHook?: RushDebugHook<T>;
    });
    /** Emits a value to all chained 'next' handlers */
    next(value: T): void;
    /** Signals an completion to 'complete' handlers */
    onComplete(handler: () => void): this;
    /** Emits an error to 'error' handlers */
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
    use(...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushUseOption]): this;
    /** Unsubscribes from the stream and clear buffer */
    unsubscribe(): this;
    /** Pauses the subscriber, buffering events if enabled */
    pause(): this;
    /** Resumes the stream, flushing buffered events */
    resume(): this;
    /** Flushes the buffer when resuming */
    private flushBuffer;
    /** Destroy the subscriber */
    destroy(): void;
}
