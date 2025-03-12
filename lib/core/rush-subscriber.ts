import { BackpressureController, BackpressureMode } from '../manager';
import {
  RushDebugHook,
  RushMiddleware,
  RushOptions,
  RushUseOption,
} from '../types';
import { createRetryWrapper } from './retry';
import { RushObserver } from './rush-observer';
import { RushStream } from './rush-stream';

/**
 * Optimized subscriber for RushStream with enhanced memory management and processing
 * @template T Type of values handled by the subscriber
 */
export class RushSubscriber<T = any> extends RushObserver<T> {
  /** Reference to the parent stream */
  public stream?: RushStream<T>;

  /** Flag to pause the subscriber */
  private isPaused: boolean = false;

  /** Backpressure controller for flow management */
  private backpressure?: BackpressureController<T>;

  /** Time control configuration */
  private timeControl: {
    type?: 'debounce' | 'throttle';
    ms?: number;
    timeout?: NodeJS.Timeout;
    temp?: T;
  } = {};

  /** Debugging hooks */
  private debugHook?: RushDebugHook<T>;

  /**
   * Creates a new optimized RushSubscriber instance
   * @param options Configuration options including optimizations
   */
  constructor(options: RushOptions<T> = {}) {
    super(options);

    if (options.backpressure) {
      this.backpressure = new BackpressureController<T>(options.backpressure);

      this.backpressure.onPause(() => {
        this.pause();
        this.debugHook?.onEmit?.({ type: 'backpressure:pause' } as any);
      });

      this.backpressure.onResume(() => {
        this.resume();
        this.debugHook?.onEmit?.({ type: 'backpressure:resume' } as any);
      });

      this.backpressure.onDrop((value) => {
        this.debugHook?.onEmit?.({ type: 'backpressure:drop', value } as any);
      });
    }

    if (options.debugHook) {
      this.debugHook = options.debugHook;
    }
  }

  /**
   * Processes an event with debounce or throttle control
   * @param value - The value to process
   */
  private processEvent(value: T): void {
    if (!this.isActive) return;

    const { type, ms, timeout } = this.timeControl;

    if (!type || !ms) {
      this.emit(value);
      return;
    }

    if (type === 'debounce') {
      this.timeControl.temp = value;
      if (timeout) clearTimeout(timeout);

      this.timeControl.timeout = setTimeout(() => {
        if (this.timeControl.temp !== undefined) {
          this.emit(this.timeControl.temp);
          this.timeControl.temp = undefined;
        }
        this.timeControl.timeout = undefined;
      }, ms);
    } else if (type === 'throttle' && !timeout) {
      this.emit(value);

      this.timeControl.timeout = setTimeout(() => {
        this.timeControl.timeout = undefined;
      }, ms);
    }
  }

  /**
   * Emits an event to the output observer with backpressure control
   * @param value - The value to emit
   */
  private emit(value: T): void {
    if (!this.isActive) return;

    if (this.isPaused) {
      if (this.backpressure) {
        this.backpressure.push(value);
      }
    } else if (this.nextHandler) {
      this.nextHandler(value);
      this.debugHook?.onEmit?.(value);
    }
  }

  /**
   * Emits a value to all chained 'next' handlers
   * @param value The value to emit
   */
  override next(value: T): void {
    if (!this.isActive) return;

    this.processEvent(value);
  }

  /**
   * Signals an error to 'error' handlers
   * @param err The error to emit
   */
  override error(err: unknown): void {
    if (!this.isActive) return;
    super.error(err);

    this.debugHook?.onError?.(err);
  }

  /**
   * Signals completion to 'complete' handlers
   */
  override complete(): void {
    if (!this.isActive) return;
    super.complete();
    this.debugHook?.onUnlisten?.('complete');
  }

  /**
   * Adds a handler for 'next' events
   * @param handler The handler to add
   */
  override onNext(handler: (value: T) => void): this {
    if (!this.isActive) return this;
    super.onNext(handler);
    return this;
  }

  /**
   * Add a handler for 'complete' events
   * @param handler The handler to add
   */
  override onComplete(handler: () => void): this {
    if (!this.isActive) return this;
    super.onComplete(handler);
    return this;
  }

  /**
   * Add a handler for 'error' events
   * @param handler The handler to add
   */
  override onError(handler: (err: unknown) => void): this {
    if (!this.isActive) return this;
    super.onError(handler);
    return this;
  }

  /**
   * Subscribe to a multicast stream
   * @param stream Stream to subscribe to
   */
  subscribe(stream: RushStream<T>): this {
    if (!this.isActive) return this;

    if (this.stream && this.stream !== stream) {
      this.unsubscribe();
    }
    stream.subscribe(this);

    this.debugHook?.onSubscribe?.(this);
    return this;
  }

  /**
   * Unsubscribes from the stream
   */
  unsubscribe(): this {
    if (!this.isActive) return this;

    if (this.stream) {
      this.stream.unsubscribe(this);
    }

    this.debugHook?.onUnsubscribe?.(this);

    return this;
  }

  /**
   * Applies middleware to transform events with retry logic
   * @param args Middleware functions or array with options
   */
  use(
    ...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushUseOption]
  ): this {
    if (!this.isActive) return this;

    let middlewares: RushMiddleware<T, T>[] = [];
    let options: RushUseOption = {};

    if (Array.isArray(args[0])) {
      middlewares = args[0];
      options = args[1] && typeof args[1] === 'object' ? args[1] : {};
    } else {
      middlewares = args as RushMiddleware<T, T>[];
    }

    if (middlewares.length === 0) return this;

    const errorHandlerWrapper = (error: unknown) => {
      options.errorHandler?.(error);
      this.error(error);
      this.debugHook?.onError?.(error);
    };

    const { applyMiddleware } = createRetryWrapper<T>(
      middlewares,
      options,
      errorHandlerWrapper
    );

    this.onNext((value) => {
      try {
        const result = applyMiddleware(value);
        if (result instanceof Promise) {
          result.catch(errorHandlerWrapper);
        }
      } catch (err) {
        errorHandlerWrapper(err);
      }
    });

    return this;
  }

  /**
   * Pauses the subscriber, buffering events if enabled
   */
  pause(): this {
    if (!this.isActive) return this;
    this.isPaused = true;
    return this;
  }

  /**
   * Resumes the subscriber, flushing buffered events
   */
  resume(): this {
    if (!this.isActive) return this;
    this.isPaused = false;

    if (this.backpressure && !this.backpressure.isEmpty) {
      while (!this.backpressure.isEmpty && !this.isPaused) {
        const value = this.backpressure.take();
        if (value) this.processEvent(value);
      }
    }
    return this;
  }

  /**
   * Destroys the subscriber
   */
  override destroy(): void {
    if (!this.isActive) return;
    this.isActive = true;

    this.unsubscribe();
    super.destroy();

    this.clearTimeControl();
    if (this.backpressure) this.backpressure.clear();
    this.debugHook?.onUnlisten?.('destroy');
  }

  /**
   * Set the debounce time in milliseconds
   */
  debounce(ms: number): this {
    if (!this.isActive) return this;

    this.clearTimeControl();
    this.timeControl = {
      type: 'debounce',
      ms,
    };

    return this;
  }

  /**
   * Set the throttle time in milliseconds
   */
  throttle(ms: number): this {
    if (!this.isActive) return this;

    this.clearTimeControl();
    this.timeControl = {
      type: 'throttle',
      ms,
    };

    return this;
  }

  /**
   * Clear time control settings and timers
   */
  private clearTimeControl(): void {
    if (this.timeControl.timeout) {
      clearTimeout(this.timeControl.timeout);
    }

    this.timeControl = {};
  }

  /**
   * Gets the underlying backpressure controller
   */
  getBackpressureController(): BackpressureController<T> | undefined {
    return this.backpressure;
  }

  /**
   * Sets the backpressure mode dynamically
   * @param mode The backpressure mode to use
   */
  setBackpressureMode(mode: BackpressureMode): this {
    if (this.backpressure) {
      this.backpressure.setMode(mode);
    }
    return this;
  }

  /**
   * Adjusts the backpressure watermark levels
   * @param highWatermark Maximum buffer size
   * @param lowWatermark Buffer level to resume normal flow
   */
  setBackpressureWatermarks(highWatermark: number, lowWatermark: number): this {
    if (this.backpressure) {
      this.backpressure.setWatermarks(highWatermark, lowWatermark);
    }
    return this;
  }
}
