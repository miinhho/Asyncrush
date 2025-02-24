import { RushMiddleware } from "../middleware/rush-middleware.types";
import { RushObserver } from "../observer/rush-observer";
import { RushObserveStream } from "../observer/rush-observer.types";
import { RushListenOption } from "./rush-stream.types";

/**
 * Stream that emits values, errors, and completion events with multicast and backpressure support
 * @template T - The type of values emitted by the stream
 */
export class RushStream<T = any> {
  /** Source observer receiving events from the producer */
  private sourceObserver = new RushObserver<T>();

  /** Output observer distributing events to listeners and subscribers */
  private outputObserver = new RushObserver<T>();

  /** Array of subscribers for multicast broadcasting */
  private subscribers: RushObserver<T>[] = [];

  /** Cleanup function returned by the producer */
  private cleanup: () => void = () => {};

  /** Flag to enable error continuation */
  private continueOnError: boolean = false;

  /** Flag to pause the stream */
  private isPaused: boolean = false;

  /** Flag to enable buffering when paused */
  private useBuffer: boolean = false;

  /** Buffer to store events when paused */
  private buffer: T[] = [];

  /** Maximum size of the buffer */
  private maxBufferSize: number = 0;

  /** Timeout for throttle control */
  private throttleTimeout: NodeJS.Timeout | null = null;

  /** Timeout for debounce control */
  private debounceTimeout: NodeJS.Timeout | null = null;

  /** Last emitted value for throttle */
  private lastEmitted: T | null = null;

  /** Last value for debounce */
  private lastValue: T | null = null;

  /**
   * Creates a new RushStream instance
   * @param producer - Function that emits events to the source observer and returns a cleanup function
   * @param options - Configuration options for buffering and error handling
   */
  constructor(
    private producer: ((observer: RushObserver<T>) => void) | ((observer: RushObserver<T>) => () => void),
    options: { useBuffer?: boolean; maxBufferSize?: number; continueOnError?: boolean } = {}
  ) {
    this.continueOnError = options.continueOnError ?? false;
    this.sourceObserver = new RushObserver<T>({ continueOnError: options.continueOnError });
    this.outputObserver = new RushObserver<T>({ continueOnError: options.continueOnError });
    if (options.useBuffer) {
      this.useBuffer = true;
      this.maxBufferSize = options.maxBufferSize ?? 1000;
      this.buffer = new Array<T>(this.maxBufferSize);
    }
    const cleanupFn = this.producer(this.sourceObserver);
    this.cleanup = cleanupFn ?? (() => { });
  }

  /** Pauses the stream, buffering events if enabled */
  pause(): this {
    this.isPaused = true;
    return this;
  }

  /** Resumes the stream, flushing buffered events */
  resume(): this {
    this.isPaused = false;
    while (this.buffer.length > 0 && !this.isPaused && this.useBuffer) {
      this.outputObserver.next(this.buffer.shift()!);
    }
    return this;
  }

  /**
   * Adds a listener to the stream with traditional observer pattern
   * @param observer - Observer with optional event handlers
   */
  listen(observer: RushObserveStream<T>): this {
    if (observer.next) {
      this.outputObserver.on('next', (value: T) => {
        if (!this.isPaused || !this.useBuffer) {
          observer.next!(value);
          return;
        }
        if (this.buffer.length < this.maxBufferSize) {
          this.buffer.push(value);
        }
      });
    }
    if (observer.error) this.outputObserver.on('error', observer.error);
    if (observer.complete) this.outputObserver.on('complete', observer.complete);
    return this;
  }

  /**
   * Subscribes a new observer for multicast events
   * @returns New RushObserver instance for the subscriber
   */
  subscribe(): RushObserver<T> {
    const sub = new RushObserver<T>({ continueOnError: this.continueOnError });
    this.subscribers.push(sub);
    return sub;
  }

  /** Unsubscribes a multicast subscriber */
  unsubscribe(subscriber: RushObserver<T>): void {
    this.subscribers = this.subscribers.filter(sub => sub !== subscriber);
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
  ): RushStream<T> {
    const { withRetry, options } = this.retryWrapper(...args);
    const { errorHandler, continueOnError } = options;

    this.sourceObserver.on('next', (value: T) => {
      const result = withRetry(value);
      if (result instanceof Promise) {
        result.then(
          (res) => {
            this.outputObserver.next(res);
            this.broadcast(res);
          },
          (err) => {
            if (errorHandler) errorHandler(err);
            if (!continueOnError) this.outputObserver.error(err);
          }
        );
      } else {
        try {
          this.outputObserver.next(result);
          this.broadcast(result);
        } catch (err) {
          if (errorHandler) errorHandler(err);
          if (!continueOnError) this.outputObserver.error(err);
        }
      }
    });
    return this;
  }

  /** Helper method to wrap middleware with retry logic */
  private retryWrapper(
    ...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushListenOption]
  ): { withRetry: (value: T, attempt?: number) => T | Promise<T>; options: RushListenOption } {
    let middlewares: RushMiddleware<T, T>[] = [];
    let options: RushListenOption = {};

    if (Array.isArray(args[0])) {
      middlewares = args[0];
      options = args[1] && typeof args[1] === 'object' ? args[1] as RushListenOption : {};
    } else {
      middlewares = args as RushMiddleware<T, T>[];
    }

    const { errorHandler,
      retries = 0,
      retryDelay = 0,
      maxRetryDelay = Infinity,
      jitter = 0,
      delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt),
      continueOnError = false
    } = options;

    const applyMiddleware = (value: T): T | Promise<T> => {
      let result: T | Promise<T> = value;
      for (const middleware of middlewares) {
        if (result instanceof Promise) {
          result = result.then((value) => middleware(value));
        } else {
          result = middleware(result);
        }
      }
      return result;
    };

    const scheduleRetry = (attempt: number, value: T): Promise<T> => {
      let delay = delayFn(attempt, retryDelay);
      if (jitter > 0) {
        const jitterFactor = 1 + jitter * (Math.random() * 2 - 1);
        delay *= jitterFactor;
      }
      delay = Math.min(delay, maxRetryDelay);
      return new Promise((resolve) => setTimeout(() => resolve(withRetry(value, attempt + 1)), delay));
    };

    const withRetry = (value: T, attempt = 0): T | Promise<T> => {
      if (retries === 0) return applyMiddleware(value);
      const result = applyMiddleware(value);
      if (result instanceof Promise) {
        return result.catch((error) => {
          if (attempt < retries) {
            return scheduleRetry(attempt, value);
          }
          throw error;
        });
      }
      try {
        return result;
      } catch (error) {
        if (attempt < retries) {
          return scheduleRetry(attempt, value);
        }
        throw error;
      }
    };

    return { withRetry, options };
  }

  /** Gets the source observer for external access */
  getObserver(): RushObserver<T> {
    return this.sourceObserver;
  }

  /** Stops the stream and emits an event */
  unlisten(option?: 'destroy' | 'complete'): this {
    switch (option) {
      case 'destroy':
        this.outputObserver.destroy();
        break;
      case 'complete':
      default:
        this.outputObserver.complete();
        break;
    }
    this.cleanup();
    return this;
  }

  /**
   * Limits event emission rate to once per specified interval
   * @param ms - Throttle interval in milliseconds
   */
  throttle(ms: number): this {
    const originalNext = this.outputObserver.next.bind(this.outputObserver);
    this.outputObserver.next = (value: T) => {
      this.lastEmitted = value;
      if (!this.throttleTimeout) {
        originalNext(value);
        this.broadcast(value);
        this.throttleTimeout = setTimeout(() => {
          this.throttleTimeout = null;
          if (this.lastEmitted !== value) {
            originalNext(this.lastEmitted!);
            this.broadcast(this.lastEmitted!);
          }
        }, ms);
      }
    };
    return this;
  }

  /**
   * Delays event emission until no new events occur for a specified period
   * @param ms - Debounce interval in milliseconds
   */
  debounce(ms: number): this {
    const originalNext = this.outputObserver.next.bind(this.outputObserver);
    this.outputObserver.next = (value: T) => {
      this.lastValue = value;
      if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        if (this.lastValue !== null) {
          originalNext(this.lastValue);
          this.broadcast(this.lastValue);
          this.lastValue = null;
        }
      }, ms);
    };
    return this;
  }
}
