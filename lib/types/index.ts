import { RushSubscriber } from '../core';
import { BackpressureMode } from '../manager';

/**
 * Interface for the RushObserver
 * @param next - Emits the next value
 * @param error - Emits an error
 * @param complete - Emits the completion event
 * @template T - The type of values handled by the observer
 */
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

/**
 * Middleware function type
 * @template I - The input type of the middleware
 * @template O - The output type of the middleware
 */
export type RushMiddleware<I, O> = (value: I) => O | Promise<O>;

/**
 * Options for applying middlewares
 * @param retries - Number of retries
 * @param retryDelay - Delay between retries
 * @param maxRetryDelay - Maximum delay between retries
 * @param jitter - Randomization factor for retry delay
 * @param delayFn - Function for setting delay time by attempt
 * @param errorHandler - Error handler
 */
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
 * Configuration options for backpressure
 */
export interface BackpressureOptions {
  /** Maximum buffer size before applying backpressure */
  highWatermark: number;

  /** Buffer level at which to resume normal flow */
  lowWatermark: number;

  /** How to handle backpressure when buffer is full */
  mode: BackpressureMode;

  /** Timeout in ms for wait mode (prevents infinite blocking) */
  waitTimeout?: number;
}

/**
 * Options for debugging stream lifecycle and event processing
 * @param onEmit - Called when a value is emitted to the stream middlewares
 * @param onSubscribe - Called when a subscriber is added to the stream
 * @param onUnsubscribe - Called when a subscriber is removed from the stream
 * @param onListen - Called when a new listener is attached to the stream
 * @param onUnlisten - Called when the stream is stopped
 * @param onError - Called when an error occurs in the stream
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
 * @param continueOnError - Whether to continue on error
 * @param maxBufferSize - Maximum buffer size for the stream
 * @param debugHook - Debugging hooks
 * @template T - The type of values handled by the stream
 */
export type RushOptions<T = any> = {
  /** Whether continue on error */
  continueOnError?: boolean;

  /** Maximum buffer size for the stream */
  maxBufferSize?: number;

  /** Debugging hooks */
  debugHook?: RushDebugHook<T>;

  /** Enable object pooling for event objects */
  useObjectPool?: boolean;

  /** Configuration for the object pool */
  poolConfig?: {
    initialSize?: number;
    maxSize?: number;
  };

  /** Configuration for backpressure support */
  backpressure?: Partial<BackpressureOptions>;

  /** EventTargets or EventEmitters that should be tracked for cleanup */
  eventTargets?: Array<EventTarget | { on: Function; off: Function }>;
};

/**
 * Result of a backpressure operation
 */
export interface BackpressureResult<T> {
  /** Whether the value was accepted */
  accepted: boolean;

  /** The value, if it was accepted */
  value?: T;

  /** Promise to wait on if in WAIT mode */
  waitPromise?: Promise<void>;
}
