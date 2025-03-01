import { RushObserver } from "../observer/rush-observer";
import { RushMiddleware, RushMiddlewareOption, RushUseOption } from "../types";
import { createRetryWrapper } from "../utils/retry-utils";
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
    if (options.maxBufferSize && options.maxBufferSize > 0) {
      this.maxBufferSize = options.maxBufferSize;
      this.buffer = [];
    }
  }

  /** Emits a value to all chained 'next' handlers */
  override next(value: T): void {
    if (this.isPaused && this.buffer) {
      if (this.buffer.length >= this.maxBufferSize!) {
        this.buffer.shift();
      }
      this.buffer.push(value);
    } else {
      if (this.nextHandler) this.nextHandler(value);
    }
  }

  /** Signals an completion to 'complete' handlers */
  override onComplete(handler: () => void): this {
    super.onComplete(handler);
    return this;
  }

  /** Emits an error to 'error' handlers */
  override onError(handler: (err: unknown) => void): this {
    super.onError(handler);
    return this;
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
    ...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushUseOption]
  ): this {
    let middlewares: RushMiddleware<T, T>[] = [];
    let options: RushUseOption = {};

    const {
      retries = 0,
      retryDelay = 0,
      maxRetryDelay = Infinity,
      jitter = 0,
      delayFn = (attempt: number, baseDelay: number) => baseDelay * Math.pow(2, attempt),
      errorHandler = (error: unknown) => { },
    } = options;

    if (Array.isArray(args[0])) {
      middlewares = args[0];``
      options = args[1] && typeof args[1] === 'object' ? args[1] as RushUseOption : {};
    } else {
      middlewares = args as RushMiddleware<T, T>[];
    }

    const errorHandlerWrapper = (error: unknown) => {
      errorHandler(error);
      this.error(error);
    };

    const { applyMiddleware } = createRetryWrapper<T>(
      middlewares, options as RushMiddlewareOption, errorHandlerWrapper
    );

    this.onNext((value) => {
      applyMiddleware(value);
    });

    return this;
  }

  /** Unsubscribes from the stream and clear buffer */
  unsubscribe(): this {
    if (this.buffer) this.buffer = [];
    if (this.stream) this.stream.unsubscribe(this);
    this.stream = undefined;
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
      try {
        if (this.nextHandler) this.nextHandler(this.buffer.shift()!);
      } catch (err) {
        this.error(err);
        break;
      }
    }
  }

  /** Destroy the subscriber */
  override destroy(): void {
    if (this.buffer) this.buffer = [];
    this.unsubscribe();
    super.destroy();
  }
}
