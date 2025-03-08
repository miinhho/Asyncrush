import { BackpressureController, BackpressureMode, createEventCleanup, PoolableEvent } from '../manager';
import { RushMiddleware, RushObserveStream, RushOptions, RushUseOption } from '../types';
import { RushObserver } from './rush-observer';
import { RushSubscriber } from './rush-subscriber';
/**
 * Stream that emits values, errors, and completion events
 * with built-in memory management, flow control, and resource cleanup
 * @template T - The type of values emitted by the stream
 */
export declare class RushStream<T = any> {
    private producer;
    /** Source observer receiving events from the producer */
    private sourceObserver;
    /** Output observer distributing events to listeners */
    private outputObserver;
    /** Flag indicating if middleware processing is enabled */
    private useHandler;
    /** Set of subscribers for multicast broadcasting */
    subscribers: Set<RushSubscriber<T>>;
    /** Cleanup function returned by the producer */
    private cleanup?;
    /** Flag to pause the stream */
    private isPaused;
    /** Flag indicating if the stream is destroyed */
    private isDestroyed;
    /** Event object pool for reusing event objects */
    private eventPool?;
    /** Backpressure controller for flow management */
    private backpressure?;
    /** Event cleanup utilities */
    private eventCleanup?;
    /** Time control configuration */
    private timeControl;
    /** Debugging hooks */
    private debugHook?;
    /**
     * Creates a new RushStream instance with optimizations
     * @param producer - Function that emits events to the source observer and returns a cleanup function
     * @param options - Configuration options for buffering, error handling, and optimizations
     */
    constructor(producer: ((observer: RushObserver<T>) => void) | ((observer: RushObserver<T>) => () => void), options?: RushOptions<T>);
    /**
     * Processes an event with debounce or throttle control and optimizations
     */
    private processEvent;
    /**
     * Processes a poolable event with special handling
     */
    private processPoolableEvent;
    /**
     * Emits an event to the output observer and broadcasts to subscribers
     * with backpressure control
     */
    private emit;
    /**
     * Pauses the stream, buffering events if enabled
     */
    pause(): this;
    /**
     * Resumes the stream, flushing buffered events
     */
    resume(): this;
    /**
     * Adds a listener to the stream
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
     * @param subscribers - The subscribers to remove
     */
    unsubscribe(...subscribers: RushSubscriber<T>[]): this;
    /**
     * Broadcasts an event to all multicast subscribers
     */
    private broadcast;
    /**
     * Applies middleware to transform events with retry logic
     * @param args - Middleware functions or array with options
     */
    use(...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushUseOption]): this;
    /**
     * Stops the stream and emits an event with options
     * @param option - The option to stop the stream (default: `complete`)
     */
    unlisten(option?: 'destroy' | 'complete'): this;
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
     * Creates a poolable event that can be efficiently reused
     * @param type Event type identifier
     * @param data Event data payload
     * @param source Event source
     * @returns A poolable event instance
     */
    createEvent(type: string, data?: any, source?: any): PoolableEvent<T>;
    /**
     * Recycles a poolable event back to the pool
     * @param event The event to recycle
     */
    recycleEvent(event: PoolableEvent<T>): void;
    /**
     * Gets the underlying backpressure controller
     */
    getBackpressureController(): BackpressureController<T> | undefined;
    /**
     * Gets the underlying event cleanup manager
     */
    getEventCleanup(): ReturnType<typeof createEventCleanup> | undefined;
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
     * Registers a DOM event listener with automatic cleanup
     * @param target DOM element
     * @param eventName Event name
     * @param listener Event handler
     * @param options Event listener options
     */
    addDOMListener(target: EventTarget, eventName: string, listener: EventListener, options?: AddEventListenerOptions): () => void;
    /**
     * Registers an EventEmitter listener with automatic cleanup
     * @param emitter EventEmitter instance
     * @param eventName Event name
     * @param listener Event handler
     */
    addEmitterListener(emitter: {
        on: Function;
        off: Function;
    }, eventName: string, listener: Function): () => void;
}
