import { RushObserver } from "../observer/rush-observer";
import { RushMiddleware } from "../types";
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
    ...middlewares: RushMiddleware<T, T>[]
  ): RushSubscriber<T> {
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

    this.onNext((value) => {
      applyMiddleware(value);
    });

    return this;
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
