import { RushObserver } from "../observer/rush-observer";
import { RushListenOption, RushMiddleware, RushObserveStream } from "../types";
import { RushSubscriber } from "./rush-subscriber";

/**
 * Stream that emits values, errors, and completion events with multicast and backpressure support
 * @template T - The type of values emitted by the stream
 */
export class RushStream<T = any> {
  /** Source observer receiving events from the producer */
  private sourceObserver = new RushObserver<T>();

  /** Output observer distributing events to listeners and subscribers */
  private outputObserver = new RushObserver<T>();

  /** Handler for connect source & output observer */
  private useHandler: ((value: T) => void) | null = null;

  /** Error handler for middleware */
  private errorHandler: ((err: unknown) => void) | null = null;

  /** Array of subscribers for multicast broadcasting */
  public subscribers: Set<RushSubscriber<T>> = new Set();

  /** Cleanup function returned by the producer */
  private cleanup: () => void = () => {};

  /** Flag to pause the stream */
  private isPaused: boolean = false;

  /** Buffer to store events when paused */
  private buffer: T[] | null = null;

  /** Maximum size of the buffer, null disables buffering */
  private maxBufferSize: number | null = null;

  /** Last value for debounce */
  private lastValue: T | null = null;

  /** Debounce time in milliseconds */
  private debounceMs: number | null = null;

  /** Timeout for debounce control */
  private debounceTimeout: NodeJS.Timeout | null = null;

  /** Throttle time in milliseconds */
  private throttleMs: number | null = null;

  /** Timeout for throttle control */
  private throttleTimeout: NodeJS.Timeout | null = null;



  /**
   * Creates a new RushStream instance
   * @param producer - Function that emits events to the source observer and returns a cleanup function
   * @param options - Configuration options for buffering and error handling
   */
  constructor(
    private producer: ((observer: RushObserver<T>) => void) | ((observer: RushObserver<T>) => () => void),
    options: { maxBufferSize?: number; continueOnError?: boolean } = {}
  ) {
    this.sourceObserver = new RushObserver<T>({ continueOnError: options.continueOnError });
    this.outputObserver = new RushObserver<T>({ continueOnError: options.continueOnError });
    if (options.maxBufferSize) {
      this.maxBufferSize = options.maxBufferSize;
      this.buffer = [];
    }
  }

  /** Processes an event with debounce or throttle control */
  private processEvent(value: T): void {
    if (this.debounceMs !== null) {
      this.lastValue = value;
      if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        if (this.lastValue !== null) {
          this.emit(this.lastValue);
          this.lastValue = null;
        }
        this.debounceTimeout = null;
      }, this.debounceMs);
    } else if (this.throttleMs !== null) {
      if (!this.throttleTimeout) {
        this.emit(value);
        this.throttleTimeout = setTimeout(() => {
          this.throttleTimeout = null;
        }, this.throttleMs);
      }
    } else {
      this.emit(value);
    }
  }

  /** Emits an event to the output observer and broadcasts to subscribers */
  private emit(value: T): void {
    if (this.isPaused && this.maxBufferSize) {
      if (this.buffer!.length >= this.maxBufferSize) {
        this.buffer!.shift();
      }
      this.buffer!.push(value);
    } else {
      this.outputObserver.next(value);
      this.broadcast(value);
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
    while (this.buffer!.length > 0 && !this.isPaused && this.maxBufferSize) {
      try {
        this.processEvent(this.buffer!.shift()!);
      } catch (err) {
        if (this.errorHandler) this.errorHandler(err);
        this.outputObserver.error(err);
      }
    }
    return this;
  }

  /**
   * Adds a listener to the stream with traditional observer pattern
   * @param observer - Observer with optional event handlers
   */
  listen(observer: RushObserveStream<T>): this {
    if (observer.next) this.outputObserver.onNext(observer.next);
    if (observer.error) this.outputObserver.onError(observer.error);
    if (observer.complete) this.outputObserver.onComplete(() => {
      observer.complete!();
      this.subscribers.forEach((sub) => sub.complete());
    });

    this.sourceObserver.onNext((value: T) => {
      this.useHandler ? this.useHandler(value) : this.processEvent(value);
    });

    const cleanupFn = this.producer(this.sourceObserver);
    this.cleanup = cleanupFn ?? (() => {});

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
    });
    return this;
  }

  /**
   * Unsubscribes a multicast subscriber
   * @param subscriber - The subscriber to remove
  */
  unsubscribe(...subscriber: RushSubscriber<T>[]): this {
    for (const sub of subscriber) {
      this.subscribers.delete(sub);
    }
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
    ...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushListenOption]
  ): this {
    const { applyMiddleware, errorHandler } = this.retryWrapper(...args);
    this.errorHandler = errorHandler;

    this.useHandler = (value: T) => {
      const result = applyMiddleware(value);
      if (result instanceof Promise) {
        result.then(
          (res) => {
            this.processEvent(res);
          });
      } else {
        this.processEvent(result);
      }
    };

    return this;
  }

  /** Stops the stream and emits an event */
  unlisten(option?: 'destroy' | 'complete'): this {
    switch (option) {
      case 'destroy': {
        this.sourceObserver.destroy();
        this.outputObserver.destroy();
        this.subscribers.clear();
        this.buffer = [];
        this.useHandler = null;
        this.debounceMs = null;
        this.throttleMs = null;
        this.debounceTimeout && clearTimeout(this.debounceTimeout);
        this.throttleTimeout && clearTimeout(this.throttleTimeout);
        break;
      }
      case 'complete':
      default: {
        this.sourceObserver.complete();
        this.outputObserver.complete();
        break;
      }
    }
    this.cleanup();
    return this;
  }

  /**
   * Helper method to wrap middleware with retry logic
   * @param args - Middleware functions or array with options
  */
  private retryWrapper(
    ...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushListenOption]
  ): { applyMiddleware: (value: T, attempt?: number) => T | Promise<T>; errorHandler: ((err: unknown) => void) | null } {
    let middlewares: RushMiddleware<T, T>[] = [];
    let options: RushListenOption = {};

    if (Array.isArray(args[0])) {
      middlewares = args[0];
      options = args[1] && typeof args[1] === 'object' ? args[1] as RushListenOption : {};
    } else {
      middlewares = args as RushMiddleware<T, T>[];
    }

    const { errorHandler = null,
      retries = 0,
      retryDelay = 0,
      maxRetryDelay = Infinity,
      jitter = 0,
      delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt),
    } = options;

    const scheduleRetry = (attempt: number, value: T): Promise<T> => {
      let delay = delayFn(attempt, retryDelay);
      if (jitter > 0) {
        const jitterFactor = 1 + jitter * (Math.random() * 2 - 1);
        delay *= jitterFactor;
      }
      delay = Math.min(delay, maxRetryDelay);
      return new Promise((resolve) => setTimeout(() => resolve(applyMiddleware(value, attempt + 1)), delay));
    };

    const applyMiddleware = (value: T, attempt: number = 0): T | Promise<T> => {
      let result: T | Promise<T> = value;
      for (const middleware of middlewares) {
        if (result instanceof Promise) {
          result = result.then((value) => {
            try {
              return middleware(value);
            }
            catch (error) {
              if (attempt < retries) {
                return scheduleRetry(attempt, value);
              }

              if (errorHandler) errorHandler(error);
              this.outputObserver.error(error);
              return value;
            }
          });
        } else {
          try {
            result = middleware(result);
          } catch (error) {
            if (attempt < retries) {
              return scheduleRetry(attempt, value);
            }

            if (errorHandler) errorHandler(error);
            this.outputObserver.error(error);
            return value;
          }
        }
      }
      return result;
    };

    return { applyMiddleware, errorHandler };
  }

  /** Set the debounce time in milliseconds  */
  debounce(ms: number): this {
    if (this.throttleMs !== null) {
      console.warn('Debounce overrides existing throttle setting');
      this.throttleMs = null;
      this.throttleTimeout && clearTimeout(this.throttleTimeout);
    }
    this.debounceMs = ms;
    return this;
  }

  /** Set the throttle time in milliseconds  */
  throttle(ms: number): this {
    if (this.debounceMs !== null) {
      console.warn('Throttle overrides existing debounce setting');
      this.debounceMs = null;
      this.debounceTimeout && clearTimeout(this.debounceTimeout);
    }
    this.throttleMs = ms;
    return this;
  }
}
