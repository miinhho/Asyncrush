import { RushObserver } from "../observer/rush-observer";
import { RushDebugHook, RushMiddleware, RushObserveStream, RushUseOption } from "../types";
import { RushSubscriber } from "./rush-subscriber";
/**
 * Stream that emits values, errors, and completion events with multicast and backpressure support
 * @template T - The type of values emitted by the stream
 */
export declare class RushStream<T = any> {
    private producer;
    /** Source observer receiving events from the producer */
    private sourceObserver;
    /** Output observer distributing events to listeners and subscribers */
    private outputObserver;
    /** Flag to stream uses `use` */
    private useHandler;
    /** Array of subscribers for multicast broadcasting */
    subscribers: Set<RushSubscriber<T>>;
    /** Cleanup function returned by the producer */
    private cleanup?;
    /** Flag to pause the stream */
    private isPaused;
    /** Buffer to store events when paused */
    private buffer?;
    /** Maximum size of the buffer, null disables buffering */
    private maxBufferSize?;
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
     * Creates a new RushStream instance
     * @param producer - Function that emits events to the source observer and returns a cleanup function
     * @param options - Configuration options for buffering and error handling
     */
    constructor(producer: ((observer: RushObserver<T>) => void) | ((observer: RushObserver<T>) => () => void), options?: {
        maxBufferSize?: number;
        continueOnError?: boolean;
        debugHook?: RushDebugHook<T>;
    });
    /** Processes an event with debounce or throttle control */
    private processEvent;
    /** Emits an event to the output observer and broadcasts to subscribers */
    private emit;
    /** Pauses the stream, buffering events if enabled */
    pause(): this;
    /** Resumes the stream, flushing buffered events */
    resume(): this;
    /** Flushes the buffer to emit all stored events */
    private flushBuffer;
    /**
     * Adds a listener to the stream with traditional observer pattern
     * @param observer - Observer with optional event handlers
     */
    listen(observer: RushObserveStream<T>): this;
    /**
     * Subscribes a multicast subscriber to the stream
     * @param subscribers - Subscribers to add
     */
    subscribe(...subscribers: RushSubscriber<T>[]): this;
    /**
     * Unsubscribes a multicast subscriber
     * @param subscriber - The subscriber to remove
    */
    unsubscribe(...subscribers: RushSubscriber<T>[]): this;
    /** Broadcasts an event to all multicast subscribers */
    private broadcast;
    /**
     * Applies middleware to transform events with retry logic
     * @param args - Middleware functions or array with options
     */
    use(...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushUseOption]): this;
    /** Stops the stream and emits an event */
    unlisten(option?: 'destroy' | 'complete'): this;
    /** Set the debounce time in milliseconds  */
    debounce(ms: number): this;
    /** Set the throttle time in milliseconds  */
    throttle(ms: number): this;
}
