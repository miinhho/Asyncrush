import { RushMiddleware } from "../middleware/rush-middleware.types";
import { RushObserver } from "../observer/rush-observer";
import { RushObserveStream } from "../observer/rush-observer.types";
import { RushListenOption } from "./rush-stream.types";
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
    /** Handler for connect source & output observer */
    private useHandler;
    /** Array of subscribers for multicast broadcasting */
    private subscribers;
    /** Cleanup function returned by the producer */
    private cleanup;
    /** Flag to enable error continuation */
    private continueOnError;
    /** Flag to pause the stream */
    private isPaused;
    /** Flag to enable buffering when paused */
    private useBuffer;
    /** Buffer to store events when paused */
    private buffer;
    /** Maximum size of the buffer */
    private maxBufferSize;
    /** Last value for debounce */
    private lastValue;
    /** Debounce time in milliseconds */
    private debounceMs;
    /** Timeout for debounce control */
    private debounceTimeout;
    /** Throttle time in milliseconds */
    private throttleMs;
    /** Timeout for throttle control */
    private throttleTimeout;
    /**
     * Creates a new RushStream instance
     * @param producer - Function that emits events to the source observer and returns a cleanup function
     * @param options - Configuration options for buffering and error handling
     */
    constructor(producer: ((observer: RushObserver<T>) => void) | ((observer: RushObserver<T>) => () => void), options?: {
        useBuffer?: boolean;
        maxBufferSize?: number;
        continueOnError?: boolean;
    });
    /** Processes an event with debounce or throttle control */
    private processEvent;
    /** Emits an event to the output observer and broadcasts to subscribers */
    private emit;
    /** Pauses the stream, buffering events if enabled */
    pause(): this;
    /** Resumes the stream, flushing buffered events */
    resume(): this;
    /**
     * Adds a listener to the stream with traditional observer pattern
     * @param observer - Observer with optional event handlers
     */
    listen(observer: RushObserveStream<T>): this;
    /**
     * Subscribes a new observer for multicast events
     * @returns New RushObserver instance for the subscriber
     */
    subscribe(): RushObserver<T>;
    /** Unsubscribes a multicast subscriber */
    unsubscribe(subscriber: RushObserver<T>): void;
    /** Broadcasts an event to all multicast subscribers */
    private broadcast;
    /**
     * Applies middleware to transform events with retry logic
     * @param args - Middleware functions or array with options
     */
    use(...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushListenOption]): RushStream<T>;
    /** Helper method to wrap middleware with retry logic */
    private retryWrapper;
    /** Stops the stream and emits an event */
    unlisten(option?: 'destroy' | 'complete'): this;
    /** Set the debounce time in milliseconds  */
    debounce(ms: number): this;
    /** Set the throttle time in milliseconds  */
    throttle(ms: number): this;
}
