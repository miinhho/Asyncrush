import {
  RushDebugHook,
  RushMiddleware,
  RushObserver,
  RushObserveStream,
  RushOptions,
  RushSubscriber,
  RushUseOption
} from "../";
import { createRetryWrapper } from "../utils/retry-utils";

/**
 * Stream that emits values, errors, and completion events with multicast and backpressure support
 * @template T - The type of values emitted by the stream
 */
export class RushStream<T = any> {
  /** Source observer receiving events from the producer */
  private sourceObserver: RushObserver<T>;

  /** Output observer distributing events to listeners and subscribers */
  private outputObserver: RushObserver<T>;

  /** Flag to stream uses `use` */
  private useHandler: boolean = false;

  /** Array of subscribers for multicast broadcasting */
  public subscribers: Set<RushSubscriber<T>> = new Set();

  /** Cleanup function returned by the producer */
  private cleanup?: () => void;

  /** Flag to pause the stream */
  private isPaused: boolean = false;

  /** Buffer to store events when paused */
  private buffer?: T[];

  /** Maximum size of the buffer, null disables buffering */
  private maxBufferSize?: number;

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
   * Creates a new RushStream instance
   * @param producer - Function that emits events to the source observer and returns a cleanup function
   * @param options - Configuration options for buffering and error handling
   */
  constructor(
    private producer: ((observer: RushObserver<T>) => void) | ((observer: RushObserver<T>) => () => void),
    options: RushOptions<T> = {}
  ) {
    this.sourceObserver = new RushObserver<T>({ continueOnError: options.continueOnError });
    this.outputObserver = new RushObserver<T>({ continueOnError: options.continueOnError });
    if (options.debugHook) this.debugHook = options.debugHook;
    if (options.maxBufferSize && options.maxBufferSize > 0) {
      this.maxBufferSize = options.maxBufferSize;
      this.buffer = [];
    }
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
      this.outputObserver.next(value);
      this.broadcast(value);

      if (this.debugHook) this.debugHook.onEmit?.(value);
    }
  }

  /** Pauses the stream, buffering events if enabled */
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

  /** Flushes the buffer to emit all stored events */
  private flushBuffer(): void {
    if (!this.buffer || this.isPaused) return;

    while (this.buffer!.length > 0 && !this.isPaused) {
      this.processEvent(this.buffer!.shift()!);
    }
  }

  /**
   * Adds a listener to the stream
   * @param observer - Observer with optional event handlers
   */
  listen(observer: RushObserveStream<T>): this {
    if (observer.next) this.outputObserver.onNext(observer.next);
    if (observer.error) {
      this.outputObserver.onError(observer.error);
      this.sourceObserver.onError(observer.error);
    }
    if (observer.complete) {
      this.outputObserver.onComplete(() => {
        observer.complete!();
        this.subscribers.forEach((sub) => sub.complete());
      });
    }

    if (!this.useHandler) this.sourceObserver.onNext((value: T) => {
      this.processEvent(value);
    });

    const cleanupFn = this.producer(this.sourceObserver);
    if (typeof cleanupFn === 'function') this.cleanup = cleanupFn;

    if (this.debugHook) this.debugHook.onListen?.(observer);
    return this;
  }

  /**
   * Subscribes a multicast subscriber to the stream
   * @param subscribers - Subscribers to add
   */
  subscribe(...subscribers: RushSubscriber<T>[]): this {
    subscribers.forEach(sub => {
      this.subscribers.add(sub);
      sub.subscribe(this);
      if (this.debugHook) this.debugHook.onSubscribe?.(sub);
    });
    return this;
  }

  /**
   * Unsubscribes a multicast subscriber
   * @param subscriber - The subscriber to remove
  */
  unsubscribe(...subscribers: RushSubscriber<T>[]): this {
    subscribers.forEach(sub => {
      this.subscribers.delete(sub);
      sub.unsubscribe();
      if (this.debugHook) this.debugHook.onUnsubscribe?.(sub);
    });
    return this;
  }

  /** Broadcasts an event to all multicast subscribers */
  private broadcast(value: T): void {
    this.subscribers.forEach(sub => sub.next(value));
  }

  /**
   * Applies middleware to transform events with retry logic
   * @param args - Middleware functions or array with options
   */
  use(
    ...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushUseOption]
  ): this {
    let middlewares: RushMiddleware<T, T>[] = [];
    let options: RushUseOption = {};

    const {
      errorHandler = (error: unknown) => { },
    } = options;

    if (Array.isArray(args[0])) {
      middlewares = args[0];
      options = args[1] && typeof args[1] === 'object' ? args[1] as RushUseOption : {};
    } else {
      middlewares = args as RushMiddleware<T, T>[];
    }

    const errorHandlerWrapper = (error: unknown) => {
      errorHandler(error);
      this.outputObserver.error(error);
      if (this.debugHook) this.debugHook.onError?.(error);
    };

    const { applyMiddleware } = createRetryWrapper<T>(
      middlewares, options, errorHandlerWrapper
    );

    const newHandler = (value: T) => {
      const result = applyMiddleware(value);
      if (result instanceof Promise) {
        result.then((res) => this.processEvent(res));
      } else {
        this.processEvent(result);
      }
    };

    this.sourceObserver.onNext(newHandler);
    this.useHandler = true;

    return this;
  }

  /**
   * Stops the stream and emits an event with options
   * @param option - The option to stop the stream (default: `complete`)
   */
  unlisten(option?: 'destroy' | 'complete'): this {
    if (option === 'destroy') {
      this.sourceObserver.destroy();
      this.outputObserver.destroy();
      this.subscribers.clear();
      this.buffer = undefined;
      this.useHandler = false;
      this.isPaused = false;
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
    } else {
      this.sourceObserver.complete();
      this.outputObserver.complete();
    }

    this.cleanup?.();
    if (this.debugHook) this.debugHook.onUnlisten?.(option);

    return this;
  }

  /** Set the debounce time in milliseconds  */
  debounce(ms: number): this {
    if (this.throttleMs) {
      console.warn('[Asyncrush] - Debounce overrides existing throttle setting');
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
      console.warn('[Asyncrush] - Throttle overrides existing debounce setting');
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
