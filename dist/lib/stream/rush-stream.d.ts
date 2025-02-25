import { RushObserver, type RushObserveStream } from "../observer";
import { RushMiddleware } from "../processor";
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
    /** Buffer to store events when paused */
    private buffer;
    /** Event processor to apply debouncing and throttling */
    private eventProcessor;
    /** Middleware processor to apply transformations and retry logic */
    private middlewareProcessor;
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
    /** Emits an event to the output observer and broadcasts to subscribers */
    private emit;
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
    /** Stops the stream and emits an event */
    unlisten(option?: 'destroy' | 'complete'): this;
    /** Get the stream is paused or not */
    isPaused(): boolean;
    /** Pauses the stream, buffering events if enabled */
    pause(): this;
    /** Resumes the stream, flushing buffered events */
    resume(): this;
    /** Set the debounce time in milliseconds  */
    debounce(ms: number): this;
    /** Set the throttle time in milliseconds  */
    throttle(ms: number): this;
}
