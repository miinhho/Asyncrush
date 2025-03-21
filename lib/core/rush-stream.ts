import {
  BackpressureController,
  BackpressureMode,
  createEventCleanup,
} from '../manager';
import {
  RushDebugHook,
  RushMiddleware,
  RushObserveStream,
  RushOptions,
  RushUseOption,
} from '../types';
import { createRetryWrapper } from './retry';
import { RushObserver } from './rush-observer';
import { RushSubscriber } from './rush-subscriber';

/**
 * Stream that emits values, errors, and completion events
 * with built-in memory management, flow control, and resource cleanup
 * @template T - The type of values emitted by the stream
 */
export class RushStream<T = any> {
  /** Source observer receiving events from the producer */
  private sourceObserver: RushObserver<T>;

  /** Output observer distributing events to listeners */
  private outputObserver: RushObserver<T>;

  /** Flag indicating if middleware processing is enabled */
  private useHandler: boolean = false;

  /** Set of subscribers for multicast broadcasting */
  public subscribers: Set<RushSubscriber<T>>;

  /** Cleanup function returned by the producer */
  private cleanup?: () => void;

  /** Flag to pause the stream */
  private isPaused: boolean = false;

  /** Flag indicating if the stream is destroyed */
  private isDestroyed: boolean = false;

  /** Backpressure controller for flow management */
  private backpressure?: BackpressureController<T>;

  /** Event cleanup utilities */
  private eventCleanup?: ReturnType<typeof createEventCleanup>;

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
   * Creates a new RushStream instance with optimizations
   * @param producer - Function that emits events to the source observer and returns a cleanup function
   * @param options - Configuration options for buffering, error handling, and optimizations
   */
  constructor(
    private producer:
      | ((observer: RushObserver<T>) => void)
      | ((observer: RushObserver<T>) => () => void),
    options: RushOptions<T> = {}
  ) {
    this.sourceObserver = new RushObserver<T>({
      continueOnError: options.continueOnError,
    });
    this.outputObserver = new RushObserver<T>({
      continueOnError: options.continueOnError,
    });
    this.subscribers = new Set();

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
    }

    if (options.eventTargets && options.eventTargets.length > 0) {
      this.eventCleanup = createEventCleanup(options.eventTargets);
    }
    if (options.debugHook) {
      this.debugHook = options.debugHook;
    }
  }

  /**
   * Processes an event with debounce or throttle control and optimizations
   * @param value - The value to process
   */
  private processEvent(value: T): void {
    if (this.isDestroyed) return;

    const { type, ms, timeout } = this.timeControl;

    if (type && ms && ms > 0) {
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
    } else {
      this.emit(value);
    }
  }

  /**
   * Emits an event to the output observer and broadcasts to subscribers
   * with backpressure control
   * @param value - The value to emit
   */
  private emit(value: T): void {
    if (this.isDestroyed) return;

    if (this.isPaused) {
      // Push value to backpressure if paused
      if (this.backpressure) {
        this.backpressure.push(value);
      }
    } else {
      this.outputObserver.next(value);
      this.broadcast(value);
      this.debugHook?.onEmit?.(value);
    }
  }

  /**
   * Pauses the stream, buffering events if enabled
   */
  pause(): this {
    if (this.isDestroyed) return this;
    this.isPaused = true;
    return this;
  }

  /**
   * Resumes the stream, flushing buffered events
   */
  resume(): this {
    if (this.isDestroyed) return this;
    this.isPaused = false;

    // If stream using backpressure & backpressure is not empty,
    // Take values from buffer and process event
    if (this.backpressure && !this.backpressure.isEmpty) {
      while (!this.backpressure.isEmpty && !this.isPaused) {
        const value = this.backpressure.take();
        if (value) this.processEvent(value);
      }
    }
    return this;
  }

  /**
   * Adds a listener to the stream
   * @param observer - Observer with optional event handlers
   */
  listen(observer: RushObserveStream<T>): this {
    if (this.isDestroyed) return this;

    if (observer.next) {
      this.outputObserver.onNext(observer.next);
    }
    if (observer.error) {
      // Handle errors in output & source
      this.outputObserver.onError((err) => {
        observer.error?.(err);
        this.debugHook?.onError?.(err);
      });
      this.sourceObserver.onError((err) => {
        observer.error?.(err);
        this.debugHook?.onError?.(err);
      });
    }
    if (observer.complete) {
      // Complete event handled in source observer
      this.sourceObserver.onComplete(() => {
        observer.complete!();
        this.subscribers.forEach((sub) => sub.complete());
      });
    }
    if (!this.useHandler) {
      this.sourceObserver.onNext((value: T) => {
        this.processEvent(value);
      });
    }

    const cleanupFn = this.producer(this.sourceObserver);
    if (typeof cleanupFn === 'function') this.cleanup = cleanupFn;

    this.debugHook?.onListen?.(observer);
    return this;
  }

  /**
   * Subscribes a multicast subscriber to the stream
   * @param subscribers - Subscribers to add
   */
  subscribe(...subscribers: RushSubscriber<T>[]): this {
    if (this.isDestroyed) return this;

    // Modify subscribers to subscribe stream
    // * Only for subscribers that didn't subscribed any stream
    for (const sub of subscribers) {
      if (this.subscribers.has(sub)) continue;
      this.subscribers.add(sub);
      sub.stream = this;
      this.debugHook?.onSubscribe?.(sub);
    }
    return this;
  }

  /**
   * Unsubscribes a multicast subscriber
   * @param subscribers - The subscribers to remove
   */
  unsubscribe(...subscribers: RushSubscriber<T>[]): this {
    if (this.isDestroyed) return this;

    // Modify subscribers to unsubscribe stream
    // * Only unsubscribing subscribers that registered in this stream
    for (const sub of subscribers) {
      if (!this.subscribers.has(sub)) continue;
      this.subscribers.delete(sub);
      sub.stream = undefined;
      this.debugHook?.onUnsubscribe?.(sub);
    }
    return this;
  }

  /**
   * Broadcasts an event to all multicast subscribers
   */
  private broadcast(value: T): void {
    if (this.isDestroyed) return;

    for (const sub of this.subscribers) {
      sub.next(value);
    }
  }

  /**
   * Applies middleware to transform events with retry logic
   * @param args - Middleware functions or array with options
   */
  use(
    ...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushUseOption]
  ): this {
    if (this.isDestroyed) return this;

    let middlewares: RushMiddleware<T, T>[] = [];
    let options: RushUseOption = {};

    // Set option by determining whether argument is an array or not.
    if (Array.isArray(args[0])) {
      middlewares = args[0];
      options = args[1] && typeof args[1] === 'object' ? args[1] : {};
    } else {
      middlewares = args as RushMiddleware<T, T>[];
    }

    if (middlewares.length === 0) return this;

    // Handle error with source observer & error handler option
    const errorHandlerWrapper = (error: unknown) => {
      options.errorHandler?.(error);
      this.sourceObserver.error(error);
      this.debugHook?.onError?.(error);
    };

    const { applyMiddleware } = createRetryWrapper<T>(
      middlewares,
      options,
      errorHandlerWrapper
    );

    // New handler for source observer
    const newHandler = (value: T) => {
      try {
        const result = applyMiddleware(value);
        if (result instanceof Promise) {
          result.then(
            (res) => this.processEvent(res),
            (err) => errorHandlerWrapper(err)
          );
        } else {
          this.processEvent(result);
        }
      } catch (err) {
        errorHandlerWrapper(err);
      }
    };

    this.sourceObserver.onNext(newHandler);
    this.useHandler = true;

    return this;
  }

  /**
   * Stops the stream and clear objects with options
   * @param option - The option to stop the stream (default: `complete`)
   */
  unlisten(option?: 'destroy' | 'complete'): this {
    if (this.isDestroyed) return this;

    this.isDestroyed = true;

    // Time control cleared regardless of the options
    this.clearTimeControl();
    if (option === 'destroy') {
      this.sourceObserver.destroy();
      this.outputObserver.destroy();
      this.subscribers.clear();
      this.useHandler = false;
      this.isPaused = false;
    } else {
      this.sourceObserver.complete();
      this.outputObserver.complete();
    }

    if (this.cleanup) {
      try {
        this.cleanup();
        this.cleanup = undefined;
      } catch (err) {
        console.error('[Asyncrush] Error in cleanup function:', err);
      }
    }

    if (this.backpressure) this.backpressure.clear();
    if (this.eventCleanup) this.eventCleanup.cleanup();

    this.debugHook?.onUnlisten?.(option);
    return this;
  }

  /**
   * Set the debounce time in milliseconds
   * @param ms - Milliseconds to debounce
   */
  debounce(ms: number): this {
    if (this.isDestroyed) return this;

    // * Clears time control to prevent debounce & throttle duplicated
    this.clearTimeControl();
    this.timeControl = {
      type: 'debounce',
      ms,
    };
    return this;
  }

  /**
   * Set the throttle time in milliseconds
   * @param ms - Milliseconds to throttle
   */
  throttle(ms: number): this {
    if (this.isDestroyed) return this;

    // * Clears time control to prevent debounce & throttle duplicated
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
   * Gets the underlying event cleanup manager
   */
  getEventCleanup(): ReturnType<typeof createEventCleanup> | undefined {
    return this.eventCleanup;
  }

  /**
   * Sets the backpressure mode dynamically
   * @param mode  The backpressure mode to use
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

  /**
   * Registers a DOM event listener with automatic cleanup
   * @param target DOM element
   * @param eventName Event name
   * @param listener Event handler
   * @param options Event listener options
   */
  addDOMListener(
    target: EventTarget,
    eventName: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): () => void {
    // * Only added when event cleanup is enabled
    if (!this.eventCleanup) {
      throw new Error(
        '[Asyncrush] Event cleanup is not enabled for this stream'
      );
    }

    return this.eventCleanup.addDOMListener(
      target,
      eventName,
      listener,
      options
    );
  }

  /**
   * Registers an EventEmitter listener with automatic cleanup
   * @param emitter EventEmitter instance
   * @param eventName Event name
   * @param listener Event handler
   */
  addEmitterListener(
    emitter: { on: Function; off: Function },
    eventName: string,
    listener: Function
  ): () => void {
    // * Only added when event cleanup is enabled
    if (!this.eventCleanup) {
      throw new Error(
        '[Asyncrush] Event cleanup is not enabled for this stream'
      );
    }

    return this.eventCleanup.addEmitterListener(emitter, eventName, listener);
  }
}
