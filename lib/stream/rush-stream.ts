import { RushObserver, RushObserveStream } from "../observer/rush-observer";

/**
 * Middleware function type
 * @param value - The input value
 * @returns The output value or a promise that resolves to the output value
 */
export type RushMiddleware<I, O> = (value: I) => O | Promise<O>;

/**
 * Options for RushStream listen method
 */
export interface RushListenOption {
  /** Error handler for middlewares in use method */
  readonly errorHandler?: (error: unknown) => void;

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

  /** Flag to middlewares in use method will continue in error */
  readonly continueOnError?: boolean;
}

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
    options: { useBuffer?: boolean; maxBufferSize?: number; continueOnError?: boolean } = {}
  ) {
    this.continueOnError = options.continueOnError ?? false;
    this.sourceObserver = new RushObserver<T>({ continueOnError: options.continueOnError });
    this.outputObserver = new RushObserver<T>({ continueOnError: options.continueOnError });
    if (options.useBuffer) {
      this.useBuffer = true;
      this.maxBufferSize = options.maxBufferSize ?? 1000;
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
    if (this.isPaused && this.useBuffer) {
      if (this.buffer.length >= this.maxBufferSize) {
        this.buffer.shift();
      }
      this.buffer.push(value);
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
    while (this.buffer.length > 0 && !this.isPaused && this.useBuffer) {
      this.processEvent(this.buffer.shift()!);
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
        observer.next!(value);
      });
    }
    if (observer.error) this.outputObserver.on('error', observer.error);
    if (observer.complete) this.outputObserver.on('complete', observer.complete);

    if (!this.useHandler) {
      this.sourceObserver.on('next', (value: T) => {
        this.processEvent(value);
      });
    } else {
      this.sourceObserver.on('next', this.useHandler);
    }

    const cleanupFn = this.producer(this.sourceObserver);
    this.cleanup = cleanupFn ?? (() => {});

    return this;
  }

  /**
   * Subscribes a new observer for multicast events
   * @returns New RushObserver instance for the subscriber
   */
  subscribe(): RushObserver<T> {
    const sub = new RushObserver<T>({ continueOnError: this.continueOnError });
    this.subscribers.push(sub);
    if (this.useBuffer && !this.isPaused) {
      this.buffer.forEach(value => sub.next(value));
    }
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

    this.useHandler = (value: T) => {
      const result = withRetry(value);
      if (result instanceof Promise) {
        result.then(
          (res) => {
            this.processEvent(res);
          },
          (err) => {
            if (errorHandler) errorHandler(err);
            if (!continueOnError) this.outputObserver.error(err);
          }
        );
      } else {
        try {
          this.processEvent(result);
        } catch (err) {
          if (errorHandler) errorHandler(err);
          if (!continueOnError) this.outputObserver.error(err);
        }
      }
    };

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

  /** Set the debounce time in milliseconds  */
  debounce(ms: number): this {
    this.debounceMs = ms;
    return this;
  }

  /** Set the throttle time in milliseconds  */
  throttle(ms: number): this {
    this.throttleMs = ms;
    return this;
  }
}
