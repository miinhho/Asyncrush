import { RushObserver } from "../observer/rush-observer";
import { RushMiddleware } from "../types";
import { RushStream } from "./rush-stream";

export class RushSubscriber<T = any> extends RushObserver<T> {
  /** Reference to the stream */
  public stream?: RushStream<T>;

  /**
   * Creates a new RushSubscriber instance
   * @param options - Whether to continue on error
   */
  constructor(options: { continueOnError?: boolean } = {}) {
    super(options);
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

  /** Destroy the subscriber */
  override destroy(): void {
    this.unsubscribe();
    super.destroy();
  }
}
