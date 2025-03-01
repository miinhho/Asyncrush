import { RushObserver } from "../observer/rush-observer";
import { RushListenOption, RushMiddleware, RushSubscriberOption } from "../types";
import { RushStream } from "./rush-stream";

export class RushSubscriber<T = any> extends RushObserver<T> {
  /** Reference to the stream */
  public stream?: RushStream<T>;

  /** Flag to pause the subscriber */
  private isPaused: boolean = false;

  /** Maximum buffer size */
  private maxBufferSize: number | null = null;

  /** Buffer for paused events */
  private buffer: T[] | null = null;

  /**
   * Creates a new RushSubscriber instance
   * @param options - Whether to continue on error
   */
  constructor(options: { continueOnError?: boolean, maxBufferSize?: number } = {}) {
    super(options);
    if (options.maxBufferSize) {
      this.maxBufferSize = options.maxBufferSize;
      this.buffer = [];
    }
  }

  /** Emits a value to all chained 'next' handlers */
  override next(value: T): void {
    if (this.isPaused && this.maxBufferSize) {
      if (this.buffer!.length >= this.maxBufferSize) {
        this.buffer!.shift();
      }
      this.buffer!.push(value);
    } else {
      if (this.nextHandler) this.nextHandler(value);
    }
  }

  /**
   * Subscribes to a stream
   * @param stream - Stream to subscribe
   */
  subscribe(stream: RushStream<T>) {
    if (this.stream && this.stream !== stream) this.unsubscribe();
    stream.subscribers.add(this);
    this.stream = stream;
    return this;
  }

  /**
   * Applies middleware to transform events with retry logic
   * @param args - Middleware functions
   */
  use(
    ...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushListenOption]
  ): RushSubscriber<T> {
    const applyMiddleware = this.retryWrapper(...args);

    this.onNext((value) => {
      applyMiddleware(value);
    });

    return this;
  }

    /**
     * Helper method to wrap middleware with retry logic
     * @param args - Middleware functions or array with options
    */
    private retryWrapper(
      ...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushSubscriberOption]
    ): (value: T, attempt?: number) => T | Promise<T> {
      let middlewares: RushMiddleware<T, T>[] = [];
      let options: RushSubscriberOption = {};

      if (Array.isArray(args[0])) {
        middlewares = args[0];
        options = args[1] && typeof args[1] === 'object' ? args[1] as RushSubscriberOption : {};
      } else {
        middlewares = args as RushMiddleware<T, T>[];
      }

      const {
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
              } catch (err) {
                if (attempt < retries) {
                  return scheduleRetry(attempt, value);
                }
                this.error(err);
                return value;
              }
            });
          } else {
            try {
              result = middleware(result);
            } catch (err) {
              if (attempt < retries) {
                return scheduleRetry(attempt, value);
              }
              this.error(err);
              return value;
            }
          }
        }
        return result;
      };

      return applyMiddleware;
    }

  /** Unsubscribes from the stream and clear buffer */
  unsubscribe() {
    if (this.stream) this.stream.unsubscribe(this);
    return this;
  }

  /** Pauses the subscriber, buffering events if enabled */
  pause() {
    this.isPaused = true;
    return this;
  }

  /** Resumes the stream, flushing buffered events */
  resume() {
    this.isPaused = false;
    while (this.buffer!.length > 0 && !this.isPaused && this.maxBufferSize) {
      try {
        this.next(this.buffer!.shift()!);
      } catch (err) {
        this.error(err);
      }
    }
    return this;
  }

  /** Destroy the subscriber */
  override destroy(): void {
    this.unsubscribe();
    super.destroy();
  }
}
