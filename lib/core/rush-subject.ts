import {
  BackpressureController,
  BackpressureMode,
  DEFAULT_BACKPRESSURE_OPTIONS,
} from '../manager';
import { RushDebugHook, RushMiddleware, RushObserveStream } from '../types';
import { RushObserver } from './rush-observer';
import { RushStream } from './rush-stream';
import { RushSubscriber } from './rush-subscriber';

/**
 * Wrapper class to use RushStream without producer
 * @template T - the type of values emitted by the subject
 */
export class RushSubject<T = any> {
  /** Controller to emit events without producer */
  private controller!: RushObserver<T>;

  /** Internal stream  */
  private stream: RushStream<T>;

  /** Debugging hooks */
  private debugHook?: RushDebugHook<T>;

  /**
   * Initialize stream which uses backpressure with default options
   */
  constructor() {
    this.stream = new RushStream<T>(
      (observer) => {
        this.controller = observer;
      },
      {
        backpressure: DEFAULT_BACKPRESSURE_OPTIONS,
      }
    ).listen({
      next: () => {},
      error: () => {},
      complete: () => {},
    });
  }

  /**
   * Emits a value to 'next' handlers
   * @param value - The value to emit
   */
  next(value: T): void {
    this.controller.next(value);
    this.debugHook?.onEmit?.(value);
  }

  /**
   * Emits an error to 'error' handlers
   * @param error - The error to emit
   */
  error(error: unknown): void {
    this.controller.error(error);
    this.debugHook?.onError?.(error);
  }

  /**
   * Signals completion to 'complete' handlers
   */
  complete(): void {
    this.controller.complete();
  }

  /**
   * Applies middleware to transform events
   * @param handlers - Middleware functions
   */
  use(...handlers: RushMiddleware<T, T>[]): this {
    this.stream.use(...handlers);
    return this;
  }

  /**
   * Adds a listener to the stream
   * @param observer - Observer with optional event handlers
   */
  listen(observer: RushObserveStream<T>): this {
    this.stream.listen(observer);
    this.debugHook?.onListen?.(observer);
    return this;
  }

  /**
   * Stops the stream and clear objects with options
   * @param option - The option to stop the stream (default: `complete`)
   * @returns
   */
  unlisten(option?: 'destroy' | 'complete'): this {
    this.stream.unlisten(option);
    this.debugHook?.onUnlisten?.(option);
    return this;
  }

  /**
   * Subscribes a multicast subscriber to the stream
   * @param subscribers - Subscribers to add
   */
  subscribe(...subscribers: RushSubscriber<T>[]): this {
    this.stream.subscribe(...subscribers);

    // Iterate with subscribers if subject uses debugger
    if (this.debugHook) {
      for (const subscriber of subscribers) {
        this.debugHook?.onSubscribe?.(subscriber);
      }
    }
    return this;
  }

  /**
   * Unsubscribes a multicast subscriber
   * @param subscribers - The subscribers to remove
   */
  unsubscribe(...subscribers: RushSubscriber<T>[]): this {
    this.stream.unsubscribe(...subscribers);

    // Iterate with subscribers if subject uses debugger
    if (this.debugHook) {
      for (const subscriber of subscribers) {
        this.debugHook?.onUnsubscribe?.(subscriber);
      }
    }
    return this;
  }

  /**
   * Set the debounce time in milliseconds
   * @param ms - Milliseconds to debounce
   */
  debounce(ms: number): this {
    this.stream.debounce(ms);
    return this;
  }

  /**
   * Set the throttle time in milliseconds
   * @param ms - Milliseconds to throttle
   */
  throttle(ms: number): this {
    this.stream.throttle(ms);
    return this;
  }

  /**
   * Gets the underlying backpressure controller
   */
  getBackpressureController(): BackpressureController<T> | undefined {
    return this.stream.getBackpressureController();
  }

  /**
   * Sets the backpressure mode dynamically
   * @param mode The backpressure mode to use
   */
  setBackpressureMode(mode: BackpressureMode): this {
    this.stream.getBackpressureController()?.setMode(mode);
    return this;
  }

  /**
   * Adjusts the backpressure watermark levels
   * @param highWatermark Maximum buffer size
   * @param lowWatermark Buffer level to resume normal flow
   */
  setBackpressureWatermarks(highWatermark: number, lowWatermark: number): this {
    this.stream
      .getBackpressureController()
      ?.setWatermarks(highWatermark, lowWatermark);
    return this;
  }

  /**
   * Pauses the stream, buffering events if enabled
   */
  pause(): this {
    this.stream.pause();
    return this;
  }

  /**
   * Resumes the stream, flushing buffered events
   */
  resume(): this {
    this.stream.resume();
    return this;
  }

  /**
   * Register debugger for stream
   * @param debugHook - Debugging hooks
   */
  debug(debugHook: RushDebugHook<T>): this {
    this.debugHook = debugHook;
    return this;
  }
}
