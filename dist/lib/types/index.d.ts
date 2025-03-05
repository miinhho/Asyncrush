import { RushSubscriber } from "lib/stream/rush-subscriber";
/** Interface for the RushObserver */
export interface RushObserverImpl<T> {
    /** Emits the next value */
    readonly next: (value: T) => void;
    /** Emits an error */
    readonly error: (err: unknown) => void;
    /** Emits the completion event */
    readonly complete: () => void;
}
/** Partial type for observer's stream options */
export type RushObserveStream<T> = Partial<RushObserverImpl<T>>;
/** Middleware function type */
export type RushMiddleware<I, O> = (value: I) => O | Promise<O>;
/** Options for retry wrapper function */
export interface RushUseOption {
    /** Retries while error resolved */
    readonly retries?: number;
    /** Retry delay */
    readonly retryDelay?: number;
    /** Max retry delay */
    readonly maxRetryDelay?: number;
    /** Jitter for randomizing retry delay time */
    readonly jitter?: number;
    /** Function for setting delay time by attempt */
    readonly delayFn?: (attempt: number, baseDelay: number) => number;
    /** Error handler */
    readonly errorHandler?: (error: unknown) => void;
}
/**
 * Options for debugging stream lifecycle and event processing
 * @template T - The type of values handled by the stream
 */
export interface RushDebugHook<T = any> {
    /**
     * Called when a value is emitted to the stream middlewares
     * @param value - The value being emitted
     */
    onEmit?: (value: T) => void;
    /**
     * Called when a subscriber is added to the stream
     * @param subscriber - The subscriber that was added
     */
    onSubscribe?: (subscriber: RushSubscriber<T>) => void;
    /**
     * Called when a subscriber is removed from the stream
     * @param subscriber - The subscriber that was removed
     */
    onUnsubscribe?: (subscriber: RushSubscriber<T>) => void;
    /**
     * Called when a new listener is attached to the stream
     * @param observer - The listener that was attached
     */
    onListen?: (observer: RushObserveStream<T>) => void;
    /**
     * Called when the stream is stopped
     * @param option - whether the stream was destroyed or completed
     */
    onUnlisten?: (option?: 'destroy' | 'complete') => void;
    /**
     * Called when an error occurs in the stream
     * @param error - The error that occurred
     */
    onError?: (error: unknown) => void;
}
/**
 * Constructor options for RushStream & RushSubscriber
 */
export type RushOptions<T = any> = {
    /** Whether continue on error */
    continueOnError?: boolean;
    /** Maximum buffer size for the stream */
    maxBufferSize?: number;
    /** Debugging hooks */
    debugHook?: RushDebugHook<T>;
};
