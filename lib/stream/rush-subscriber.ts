/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  RushDebugHook,
  RushMiddleware,
  RushObserver,
  RushOptions,
  RushStream,
  RushUseOption,
} from '../';
import { createRetryWrapper } from '../utils/retry-utils';

export class RushSubscriber<T = any> extends RushObserver<T> {
  /** Reference to the stream */
  public stream?: RushStream<T>;

  /** Flag to pause the subscriber */
  private isPaused: boolean = false;

  /** Maximum buffer size */
  private maxBufferSize?: number;

  /** Buffer for paused events */
  private buffer?: T[];

  /** Last value for debounce */
  private debounceTemp?: T;

  /** Debounce time in milliseconds */
  private debounceMs?: number;

  /** Timeout for debounce control */
  private debounceTimeout?: NodeJS.Timeout;

  /** Throttle time in milliseconds */
  private throttleMs?: number;

  /** Timeout for throttle control */
  private throttleTimeout?: NodeJS.Timeout;

  /** Debugging hooks */
  private debugHook?: RushDebugHook<T>;

  /**
   * Creates a new RushSubscriber instance
   * @param options - Whether to continue on error
   */
  constructor(options: RushOptions<T> = {}) {
    super(options);
    if (options.maxBufferSize && options.maxBufferSize > 0) {
      this.maxBufferSize = options.maxBufferSize;
      this.buffer = [];
    }

    if (options.debugHook) this.debugHook = options.debugHook;
  }

  /** Processes an event with debounce or throttle control */
  private processEvent(value: T): void {
    if (this.debounceMs && this.debounceMs > 0) {
      this.debounceTemp = value;
      if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        if (this.debounceTemp) {
          this.emit(this.debounceTemp);
          this.debounceTemp = undefined;
        }
        this.debounceTimeout = undefined;
      }, this.debounceMs);
    } else if (this.throttleMs && this.throttleMs > 0) {
      if (!this.throttleTimeout) {
        this.emit(value);
        this.throttleTimeout = setTimeout(() => {
          this.throttleTimeout = undefined;
        }, this.throttleMs);
      }
    } else {
      this.emit(value);
    }
  }

  /** Emits an event to the output observer and broadcasts to subscribers */
  private emit(value: T): void {
    if (this.isPaused && this.buffer) {
      if (this.buffer.length >= this.maxBufferSize!) {
        this.buffer.shift();
      }
      this.buffer.push(value);
    } else {
      this.nextHandler!(value);

      if (this.debugHook) this.debugHook.onEmit?.(value);
    }
  }

  /** Emits a value to all chained 'next' handlers */
  override next(value: T): void {
    if (this.nextHandler) this.processEvent(value);
  }

  /** Signals an completion to 'complete' handlers */
  override complete(): void {
    if (this.debugHook) this.debugHook.onUnlisten?.('complete');
    super.complete();
  }

  /**
   * Adds a handlers for 'next' events, chaining with existing handlers
   * @param handlers - The handlers to add
   */
  override onNext(handler: (value: T) => void): this {
    super.onNext(handler);
    return this;
  }

  /** Add a handler for 'complete' events */
  override onComplete(handler: () => void): this {
    super.onComplete(handler);
    return this;
  }

  /** Add a handler for 'error' events */
  override onError(handler: (err: unknown) => void): this {
    super.onError(handler);
    return this;
  }

  /**
   * Subscribes to a stream
   * @param stream - Stream to subscribe
   */
  subscribe(stream: RushStream<T>): this {
    if (this.stream && this.stream !== stream) this.unsubscribe();
    stream.subscribers.add(this);
    this.stream = stream;

    if (this.debugHook) this.debugHook.onSubscribe?.(this);
    return this;
  }

  /**
   * Applies middleware to transform events with retry logic
   * @param args - Middleware functions
   */
  use(
    ...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushUseOption]
  ): this {
    let middlewares: RushMiddleware<T, T>[] = [];
    let options: RushUseOption = {};

    const { errorHandler = (error: unknown) => {} } = options;

    if (Array.isArray(args[0])) {
      middlewares = args[0];
      options =
        args[1] && typeof args[1] === 'object'
          ? (args[1] as RushUseOption)
          : {};
    } else {
      middlewares = args as RushMiddleware<T, T>[];
    }

    const errorHandlerWrapper = (error: unknown) => {
      errorHandler(error);
      this.error(error);
      if (this.debugHook) this.debugHook.onError?.(error);
    };

    const { applyMiddleware } = createRetryWrapper<T>(
      middlewares,
      options,
      errorHandlerWrapper
    );

    this.onNext((value) => {
      applyMiddleware(value);
    });

    return this;
  }

  /** Unsubscribes from the stream and clear buffer */
  unsubscribe(): this {
    if (this.buffer) this.buffer = [];
    if (this.stream?.subscribers.has(this)) this.stream.unsubscribe(this);
    this.stream = undefined;

    if (this.debugHook) this.debugHook.onUnsubscribe?.(this);
    return this;
  }

  /** Pauses the subscriber, buffering events if enabled */
  pause(): this {
    this.isPaused = true;
    return this;
  }

  /** Resumes the stream, flushing buffered events */
  resume(): this {
    this.isPaused = false;
    this.flushBuffer();
    return this;
  }

  /** Flushes the buffer when resuming */
  private flushBuffer(): void {
    if (!this.buffer || this.isPaused) return;

    while (this.buffer.length > 0 && !this.isPaused) {
      this.processEvent(this.buffer.shift()!);
    }
  }

  /** Destroy the subscriber */
  override destroy(): void {
    this.unsubscribe();
    super.destroy();
    if (this.buffer) this.buffer = undefined;
    this.debounceTemp = undefined;
    this.debounceMs = undefined;
    this.throttleMs = undefined;
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = undefined;
    }
    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
      this.throttleTimeout = undefined;
    }

    if (this.debugHook) this.debugHook.onUnlisten?.('destroy');
  }

  /** Set the debounce time in milliseconds  */
  debounce(ms: number): this {
    if (this.throttleMs) {
      console.warn(
        '[Asyncrush] - Debounce overrides existing throttle setting'
      );
      this.throttleMs = undefined;
      if (this.throttleTimeout) {
        clearTimeout(this.throttleTimeout);
        this.throttleTimeout = undefined;
      }
    }
    this.debounceMs = ms;
    return this;
  }

  /** Set the throttle time in milliseconds  */
  throttle(ms: number): this {
    if (this.debounceMs) {
      console.warn(
        '[Asyncrush] - Throttle overrides existing debounce setting'
      );
      this.debounceMs = undefined;
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = undefined;
      }
    }
    this.throttleMs = ms;
    return this;
  }
}
