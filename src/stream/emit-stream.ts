import { EmitMiddleware } from "@middleware/emit-middleware.types";
import { EmitObserver } from "@observer/emit-observer";
import { EmitObserveStream } from "@observer/emit-observer.types";
import { EmitListenOption } from "./emit-stream.types";

/**
 * Stream that emits values, errors, and completion events
 */
export class EmitStream<T = any> {
  private sourceObserver = new EmitObserver<T>();
  private outputObserver = new EmitObserver<T>();
  private cleanup: () => void = () => { };
  private isPaused: boolean = false;
  private buffer: T[] = [];
  private maxBufferSize: number;

  /**
   * @param producer - A function that takes an EmitObserver and returns a cleanup function
   */
  constructor(
    private producer: (observer: EmitObserver<T>) => () => void | void,
    options: { maxBufferSize?: number, continueOnError?: boolean } = {}
  ) {
    this.sourceObserver = new EmitObserver<T>({ continueOnError: options.continueOnError });
    this.outputObserver = new EmitObserver<any>({ continueOnError: options.continueOnError });
    this.maxBufferSize = options.maxBufferSize ?? Infinity;
    this.buffer = new Array<T>(this.maxBufferSize);
    const cleanupFn = this.producer(this.sourceObserver);
    this.cleanup = cleanupFn ?? (() => { });
  }

  /**
   * Pauses the stream, buffering values if resumed
   * @returns The EmitStream instance for chaining
   */
  pause(): this {
    this.isPaused = true;
    return this;
  }

  /**
   * Resumes the stream, flushing buffered values
   * @returns The EmitStream instance for chaining
   */
  resume(): this {
    this.isPaused = false;
    while (this.buffer.length > 0 && !this.isPaused) {
      this.outputObserver.next(this.buffer.shift()!);
    }
    return this;
  }

  /**
   * Subscribes an observer to the stream
   * @param observer - Partial observer implementation with event handlers
   * @returns - The EmitStream instance for chaining
   */
  listen(observer: EmitObserveStream<T>): this {
    if (observer.next) {
      this.outputObserver.on('next', (value: T) => {
        if (this.isPaused && this.maxBufferSize > 0) {
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
    ...args: EmitMiddleware<T, T>[]
      | [EmitMiddleware<T, T>[], EmitListenOption]
  ): EmitStream<T> {
    let middlewares: EmitMiddleware<T, T>[] = [];
    let options: EmitListenOption = {};

    if (Array.isArray(args[0])) {
      middlewares = args[0];
      options = (args[1] && typeof args[1] === 'object') ? args[1] as EmitListenOption : {};
    } else {
      middlewares = args as ((value: T) => T | Promise<T>)[];
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

    const applyMiddleware = async (value: T): Promise<T> => {
      let result = value;
      for (const mw of middlewares) {
        const middlewareResult = mw(result);
        result = middlewareResult instanceof Promise ? await middlewareResult : middlewareResult;
      }
      return result;
    }

    const withRetry = async (value: T): Promise<T> => {
      let lastError: unknown;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const result = applyMiddleware(value);
          return await result;
        } catch (error) {
          lastError = error;
          if (attempt < retries) {
            let delay = delayFn(attempt, retryDelay);
            if (jitter > 0) {
              const jitterFactor = 1 + jitter * (Math.random() * 2 - 1);
              delay *= jitterFactor;
            }
            delay = Math.min(delay, maxRetryDelay);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw lastError;
          }
        }
      }
      throw lastError;
    };

    this.sourceObserver.on('next', async (value: T) => {
      const result = retries > 0 ? withRetry(value) : applyMiddleware(value);
      result.then(
        (res) => this.outputObserver.next(res),
        (err) => {
          if (errorHandler) errorHandler(err);
          if (!continueOnError) this.outputObserver.error(err);
        }
      );
    });

    return this;
  }

  /**
   * Get the stream's observer instance
   * @returns The EmitObserver instance
   */
  getObserver(): EmitObserver<T> {
    return this.sourceObserver;
  }

  /**
   * Unsubscribes from the stream and emits specified event
   * @param option - Specific event to emit when unsubscribing
   * @returns {this} - The EmitStream instance for chaining
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
