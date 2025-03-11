import { BackpressureController, BackpressureMode } from '../manager';
import { RushMiddleware, RushOptions, RushUseOption } from '../types';
import { RushObserver } from './rush-observer';
import { RushStream } from './rush-stream';
/**
 * Optimized subscriber for RushStream with enhanced memory management and processing
 * @template T Type of values handled by the subscriber
 */
export declare class RushSubscriber<T = any> extends RushObserver<T> {
    /** Reference to the parent stream */
    stream?: RushStream<T>;
    /** Flag to pause the subscriber */
    private isPaused;
    /** Backpressure controller for flow management */
    private backpressure?;
    /** Time control configuration */
    private timeControl;
    /** Debugging hooks */
    private debugHook?;
    /**
     * Creates a new optimized RushSubscriber instance
     * @param options Configuration options including optimizations
     */
    constructor(options?: RushOptions<T>);
    /**
     * Processes an event with debounce or throttle control
     * @param value The value to process
     */
    private processEvent;
    /**
     * Emits an event to the output observer with backpressure control
     * @param value The value to emit
     */
    private emit;
    /**
     * Emits a value to all chained 'next' handlers
     * @param value The value to emit
     */
    next(value: T): void;
    /**
     * Signals an error to 'error' handlers
     * @param err The error to emit
     */
    error(err: unknown): void;
    /**
     * Signals completion to 'complete' handlers
     */
    complete(): void;
    /**
     * Adds a handler for 'next' events
     * @param handler The handler to add
     */
    onNext(handler: (value: T) => void): this;
    /**
     * Add a handler for 'complete' events
     * @param handler The handler to add
     */
    onComplete(handler: () => void): this;
    /**
     * Add a handler for 'error' events
     * @param handler The handler to add
     */
    onError(handler: (err: unknown) => void): this;
    /**
     * Subscribe to a multicast stream
     * @param stream Stream to subscribe to
     */
    subscribe(stream: RushStream<T>): this;
    /**
     * Unsubscribes from the stream
     */
    unsubscribe(): this;
    /**
     * Applies middleware to transform events with retry logic
     * @param args Middleware functions or array with options
     */
    use(...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushUseOption]): this;
    /**
     * Pauses the subscriber, buffering events if enabled
     */
    pause(): this;
    /**
     * Resumes the subscriber, flushing buffered events
     */
    resume(): this;
    /**
     * Destroys the subscriber
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
    /**
     * Clear time control settings and timers
     */
    private clearTimeControl;
    /**
     * Gets the underlying backpressure controller
     */
    getBackpressureController(): BackpressureController<T> | undefined;
    /**
     * Sets the backpressure mode dynamically
     * @param mode The backpressure mode to use
     */
    setBackpressureMode(mode: BackpressureMode): this;
    /**
     * Adjusts the backpressure watermark levels
     * @param highWatermark Maximum buffer size
     * @param lowWatermark Buffer level to resume normal flow
     */
    setBackpressureWatermarks(highWatermark: number, lowWatermark: number): this;
}
