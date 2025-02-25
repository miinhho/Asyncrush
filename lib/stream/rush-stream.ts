import { RushObserver, type RushObserveStream } from "../observer";
import {
  RushBuffer,
  RushEventProcessor,
  RushMiddleware,
  RushMiddlewareProcessor
} from "../processor";
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

  /** Handler for connect source & output observer */
  private useHandlers: ((value: T, next: (value: T) => void) => void)[] = [];

  /** Array of subscribers for multicast broadcasting */
  private subscribers: RushObserver<T>[] = [];

  /** Cleanup function returned by the producer */
  private cleanup: () => void = () => {};

  /** Flag to enable error continuation */
  private continueOnError: boolean = false;

  /** Buffer to store events when paused */
  private buffer: RushBuffer<T> = new RushBuffer<T>();

  /** Event processor to apply debouncing and throttling */
  private eventProcessor: RushEventProcessor<T>;

  /** Middleware processor to apply transformations and retry logic */
  private middlewareProcessor: RushMiddlewareProcessor<T> | null = null;

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
      this.buffer = new RushBuffer<T>(options.maxBufferSize ?? 1000);
    }

    this.eventProcessor = new RushEventProcessor<T>((value) => this.emit(value));
  }

  /** Emits an event to the output observer and broadcasts to subscribers */
  private emit(value: T): void {
    if (this.buffer.paused) {
      this.buffer.add(value);
    } else {
      this.outputObserver.next(value);
      this.broadcast(value);
    }
  }

  private processHandler(value: T, index: number): void {
    if (index < this.useHandlers.length) {
      this.useHandlers[index](value, (nextValue: T) =>
      this.processHandler(nextValue, index + 1));
    } else {
      this.eventProcessor.process(value);
    }
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

    this.sourceObserver.on('next', (value: T) => {
      this.processHandler(value, 0);
    });
    const cleanupFn = this.producer(this.sourceObserver);
    this.cleanup = cleanupFn ?? (() => { });

    return this;
  }

  /**
   * Subscribes a new observer for multicast events
   * @returns New RushObserver instance for the subscriber
   */
  subscribe(): RushObserver<T> {
    const sub = new RushObserver<T>({ continueOnError: this.continueOnError });
    this.subscribers.push(sub);
    if (!this.isPaused()) {
      this.buffer.resume((value) => sub.next(value));
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
    let middlewares: RushMiddleware<T, T>[] = [];
    let middlewareOptions: RushListenOption = {};

    if (Array.isArray(args[0])) {
      middlewares = args[0];
      middlewareOptions = args[1] && typeof args[1] === 'object' ? args[1] as RushListenOption : {};
    } else {
      middlewares = args as RushMiddleware<T, T>[];
    }

    const { retry, options } = (this.middlewareProcessor)
      ? this.middlewareProcessor.add(...middlewares).withRetry()
      : new RushMiddlewareProcessor<T>(middlewares, middlewareOptions).withRetry();
    const { errorHandler, continueOnError } = options;

    const handler = (value: T, next: (value: T) => void) => {
      const result = retry(value);
      if (result instanceof Promise) {
        result.then(
          (res) => {
            next(res);
          },
          (err) => {
            if (errorHandler) errorHandler(err);
            if (!continueOnError) this.outputObserver.error(err);
          }
        );
      } else {
        try {
          next(result);
        } catch (err) {
          if (errorHandler) errorHandler(err);
          if (!continueOnError) this.outputObserver.error(err);
        }
      }
    };
    this.useHandlers.push(handler);

    return this;
  }

  /** Stops the stream and emits an event */
  unlisten(option?: 'destroy' | 'complete'): this {
    if (option === 'destroy') {
      this.sourceObserver.destroy();
      this.outputObserver.destroy();
    }
    else this.outputObserver.complete();
    this.cleanup();
    return this;
  }

  /** Get the stream is paused or not */
  isPaused(): boolean {
    return this.buffer.paused;
  }

  /** Pauses the stream, buffering events if enabled */
  pause(): this {
    this.buffer.pause();
    return this;
  }

  /** Resumes the stream, flushing buffered events */
  resume(): this {
    this.buffer.resume((value) => this.emit(value));
    return this;
  }

  /** Set the debounce time in milliseconds  */
  debounce(ms: number): this {
    this.eventProcessor.setDebounce(ms);
    return this;
  }

  /** Set the throttle time in milliseconds  */
  throttle(ms: number): this {
    this.eventProcessor.setThrottle(ms);
    return this;
  }
}
