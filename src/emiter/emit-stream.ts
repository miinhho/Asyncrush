import { EmitMiddleware } from "@middleware/middleware.types";
import { EmitObserver } from "./emit-observer";
import { EmitObserveStream } from "./emit-observer.types";

/**
 * Stream that emits values, errors, and completion events
 */
export class EmitStream<T = any> {
  private emitObserver: EmitObserver<T>;
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
    this.emitObserver = new EmitObserver<T>({ continueOnError: options.continueOnError });
    this.maxBufferSize = options.maxBufferSize ?? Infinity;
    const cleanupFn = this.producer(this.emitObserver);
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
      this.emitObserver.next(this.buffer.shift()!);
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
      this.emitObserver.on('next', (value: T) => {
        if (this.isPaused && this.maxBufferSize > 0) {
          if (this.buffer.length < this.maxBufferSize) {
            this.buffer.push(value);
          }
          return;
        }
        observer.next!(value);
      });
    }
    if (observer.error) this.emitObserver.on('error', observer.error);
    if (observer.complete) this.emitObserver.on('complete', observer.complete);
    return this;
  }

  /**
   * Applies synchronous middleware transformations to the stream
   * @param middlewares - Array of synchronous middleware functions
   * @returns A new transformed EmitStream instance
   */
  use<R = T>(
    ...middlewares: EmitMiddleware<T, R>[]
  ): EmitStream<R> {
    return middlewares.reduce(
      (currentStream: EmitStream<any>, middleware: EmitMiddleware<any, any>) =>
        middleware(currentStream),
      this as EmitStream<any>
    ) as EmitStream<R>;
  }

  /**
   * Applies asynchronous middleware transformations to the stream
   * @param middlewares - Array of asynchronous middleware functions
   * @returns Promise resolving to a new transformed EmitStream instance
   */
  async asyncUse<R = T>(
    ...args: EmitMiddleware<T, R>[] | [EmitMiddleware<T, R>[], { parallel?: boolean }]
  ): Promise<EmitStream<R>> {
    let middlewares: EmitMiddleware<T, R>[];
    let isParallel = false;

    if (Array.isArray(args[0])) {
      middlewares = args[0];
      const options = args[1] as { parallel?: boolean } | undefined;
      isParallel = options?.parallel ?? false;
    } else {
      middlewares = args as EmitMiddleware<T, R>[];
    }

    if (isParallel) {
      const results = await Promise.all(middlewares.map(async (mw) => (await mw)(this)));
      return results[results.length - 1] || this;
    }

    let stream: EmitStream<any> = this;
    for (const middleware of middlewares) {
      stream = (await middleware)(stream);
    }
    return stream as EmitStream<R>;
  }

  /**
   * Get the stream's observer instance
   * @returns The EmitObserver instance
   */
  getObserver(): EmitObserver<T> {
    return this.emitObserver;
  }

  /**
   * Unsubscribes from the stream and emits specified event
   * @param option - Specific event to emit when unsubscribing
   * @returns {this} - The EmitStream instance for chaining
   */
  unlisten(option?: Exclude<keyof EmitObserveStream<T>, 'next' | 'destroy'>): this {
    switch (option) {
      case 'error': {
        this.emitObserver.emit('error', new Error('Stream unlistened'));
        break;
      }
      case 'complete':
      default: {
        this.emitObserver.emit('complete');
        break;
      }
    }
    this.cleanup();
    return this;
  }
}
