import { BackpressureController, BackpressureMode } from '../manager';
import { RushDebugHook, RushMiddleware, RushObserveStream } from '../types';
import { RushSubscriber } from './rush-subscriber';
/**
 * Wrapper class to use RushStream without producer
 * @template T - the type of values emitted by the subject
 */
export declare class RushSubject<T = any> {
    /** Controller to emit events without producer */
    private controller;
    /** Internal stream  */
    private stream;
    /** Debugging hooks */
    private debugHook?;
    /**
     * Initialize stream which uses backpressure with default options
     */
    constructor();
    /**
     * Emits a value to 'next' handlers
     * @param value - The value to emit
     */
    next(value: T): void;
    /**
     * Emits an error to 'error' handlers
     * @param error - The error to emit
     */
    error(error: unknown): void;
    /**
     * Signals completion to 'complete' handlers
     */
    complete(): void;
    /**
     * Applies middleware to transform events
     * @param handlers - Middleware functions
     */
    use(...handlers: RushMiddleware<T, T>[]): this;
    /**
     * Adds a listener to the stream
     * @param observer - Observer with optional event handlers
     */
    listen(observer: RushObserveStream<T>): this;
    /**
     * Stops the stream and clear objects with options
     * @param option - The option to stop the stream (default: `complete`)
     * @returns
     */
    unlisten(option?: 'destroy' | 'complete'): this;
    /**
     * Subscribes a multicast subscriber to the stream
     * @param subscribers - Subscribers to add
     */
    subscribe(...subscribers: RushSubscriber<T>[]): this;
    /**
     * Unsubscribes a multicast subscriber
     * @param subscribers - The subscribers to remove
     */
    unsubscribe(...subscribers: RushSubscriber<T>[]): this;
    /**
     * Set the debounce time in milliseconds
     * @param ms - Milliseconds to debounce
     */
    debounce(ms: number): this;
    /**
     * Set the throttle time in milliseconds
     * @param ms - Milliseconds to throttle
     */
    throttle(ms: number): this;
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
    /**
     * Pauses the stream, buffering events if enabled
     */
    pause(): this;
    /**
     * Resumes the stream, flushing buffered events
     */
    resume(): this;
    /**
     * Register debugger for stream
     * @param debugHook - Debugging hooks
     */
    debug(debugHook: RushDebugHook<T>): this;
}
