import { RushMiddleware } from "../middleware/rush-middleware.types";
import { RushObserver } from "../observer/rush-observer";
import { EmitObserveStream } from "../observer/rush-observer.types";
import { RushListenOption } from "./rush-stream.types";

/**
 * Stream that emits values, errors, and completion events
 */
export class RushStream<T = any> {
  private sourceObserver = new RushObserver<T>();
  private outputObserver = new RushObserver<T>();
  private cleanup: () => void = () => { };
  private isPaused: boolean = false;
  private useBuffer: boolean = false;
  private buffer: T[] = [];
  private maxBufferSize: number = 0;

  /**
   * @param producer - A function that takes an RushObserver and returns a cleanup function
   */
  constructor(
    private producer: (observer: RushObserver<T>) => () => void | void,
    options: { useBuffer?: boolean, maxBufferSize?: number, continueOnError?: boolean } = {}
  ) {
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

  /**
   * Pauses the stream, buffering values if resumed
   * @returns The RushStream instance for chaining
   */
  pause(): this {
    this.isPaused = true;
    return this;
  }

  /**
   * Resumes the stream, flushing buffered values
   * @returns The RushStream instance for chaining
   */
  resume(): this {
    this.isPaused = false;
    while (this.buffer.length > 0 && !this.isPaused && this.useBuffer) {
      this.outputObserver.next(this.buffer.shift()!);
    }
    return this;
  }

  /**
   * Subscribes an observer to the stream
   * @param observer - Partial observer implementation with event handlers
   * @returns - The RushStream instance for chaining
   */
  listen(observer: EmitObserveStream<T>): this {
    if (observer.next) {
      this.outputObserver.on('next', (value: T) => {
        if (this.isPaused && this.maxBufferSize > 0 && this.useBuffer) {
          if (this.buffer.length < this.maxBufferSize) {
            this.buffer.push(value);
          }
          return;
        }
        observer.next!(value);
      });
    }
    if (observer.error) this.outputObserver.on('error', observer.error);
    if (observer.complete) this.outputObserver.on('complete', observer.complete);
    return this;
  }

  use(
    ...args: RushMiddleware<T, T>[]
      | [RushMiddleware<T, T>[], RushListenOption]
  ): RushStream<T> {
    let middlewares: RushMiddleware<T, T>[] = [];
    let options: RushListenOption = {};

    if (Array.isArray(args[0])) {
      middlewares = args[0];
      options = (args[1] && typeof args[1] === 'object') ? (args[1] as RushListenOption) : {};
    } else {
      middlewares = args as RushMiddleware<T, T>[];
    }

    const {
      errorHandler,
      retries = 0,
      retryDelay = 0,
      maxRetryDelay = Infinity,
      jitter = 0,
      delayFn = (attempt, baseDelay) => baseDelay * Math.pow(2, attempt),
      continueOnError = false,
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

    this.sourceObserver.on('next', (value: T) => {
      const result = withRetry(value);
      if (result instanceof Promise) {
        result.then(
          (res) => this.outputObserver.next(res),
          (err) => {
            if (errorHandler) errorHandler(err);
            if (!continueOnError) this.outputObserver.error(err);
          }
        )
      } else {
        try {
          this.outputObserver.next(result);
        } catch (err) {
          if (errorHandler) errorHandler(err);
          if (!continueOnError) this.outputObserver.error(err);
        }
      }
    });

    return this;
  }

  /**
   * Get the stream's observer instance
   * @returns The RushObserver instance
   */
  getObserver(): RushObserver<T> {
    return this.sourceObserver;
  }

  /**
   * Unsubscribes from the stream and emits specified event
   * @param option - Specific event to emit when unsubscribing
   * @returns {this} - The RushStream instance for chaining
   */
  unlisten(option?: 'destory' | 'complete'): this {
    switch (option) {
      case 'destory': {
        this.outputObserver.destroy();
        break;
      }
      case 'complete':
      default: {
        this.outputObserver.complete();
        break;
      }
    }
    this.cleanup();
    return this;
  }
}
