import { RushMiddleware, RushObserver, RushOptions, RushStream, RushUseOption } from '../';
export declare class RushSubscriber<T = any> extends RushObserver<T> {
    /** Reference to the stream */
    stream?: RushStream<T>;
    /** Flag to pause the subscriber */
    private isPaused;
    /** Maximum buffer size */
    private maxBufferSize?;
    /** Buffer for paused events */
    private buffer?;
    /** Last value for debounce */
    private debounceTemp?;
    /** Debounce time in milliseconds */
    private debounceMs?;
    /** Timeout for debounce control */
    private debounceTimeout?;
    /** Throttle time in milliseconds */
    private throttleMs?;
    /** Timeout for throttle control */
    private throttleTimeout?;
    /** Debugging hooks */
    private debugHook?;
    /**
     * Creates a new RushSubscriber instance
     * @param options - Whether to continue on error
     */
    constructor(options?: RushOptions<T>);
    /**
     * Processes an event with debounce or throttle control
     * @param value - The value to process
     */
    private processEvent;
    /**
     * Emits an event to the output observer and broadcasts to subscribers
     * @param value - The value to emit
     */
    private emit;
    /**
     * Emits a value to all chained 'next' handlers
     * @param value - The value to emit
     */
    next(value: T): void;
    /**
     * Signals an completion to 'complete' handlers
     */
    complete(): void;
    /**
     * Adds a handlers for 'next' events, chaining with existing handlers
     * @param handlers - The handlers to add
     */
    onNext(handler: (value: T) => void): this;
    /**
     * Add a handler for 'complete' events
     */
    onComplete(handler: () => void): this;
    /**
     * Add a handler for 'error' events
     */
    onError(handler: (err: unknown) => void): this;
    /**
     * Subscribe a multicase subscriber to a stream
     * @param stream - Stream to subscribe
     */
    subscribe(stream: RushStream<T>): this;
    /**
     * Applies middleware to transform events with retry logic
     * @param args - Middleware functions or array with options
     */
    use(...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushUseOption]): this;
    /**
     * Unsubscribes from the stream and clear buffer
     */
    unsubscribe(): this;
    /**
     * Pauses the subscriber, buffering events if enabled
     */
    pause(): this;
    /**
     * Resumes the stream, flushing buffered events
     */
    resume(): this;
    /**
     * Flushes the buffer when resuming
     */
    private flushBuffer;
    /**
     * Destroy the subscriber
     */
    destroy(): void;
    /**
     * Set the debounce time in milliseconds
     */
    debounce(ms: number): this;
    /**
     * Set the throttle time in milliseconds
     */
    throttle(ms: number): this;
}
