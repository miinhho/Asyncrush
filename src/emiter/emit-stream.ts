import { EmitAsyncMiddleware, EmitMiddleware } from "@middleware/middleware.types";
import { EmitObserver } from "./emit-observer";
import { EmitObserveStream } from "./emit-observer.types";

/**
 * Stream that emits values, errors, and completion events
 */
export class EmitStream {
  private emitObserver: EmitObserver;

  /**
   * Cleanup function called when unlisten is called
   */
  private cleanup: () => void = () => { };

  /**
   * @param producer - A function that takes an EmitObserver and returns a cleanup function
   */
  constructor(
    private producer: (observer: EmitObserver) => () => void
  ) {
    this.emitObserver = new EmitObserver();
  }

  /**
   * Subscribes an observer to the stream
   * @param observer - An object with optional next, error, and complete methods
   * @returns {this} - The EmitStream instance
   */
  listen(observer: EmitObserveStream): this {
    const eventObserver = this.emitObserver;

    if (observer.next) {
      eventObserver.on('next', observer.next);
    }
    if (observer.error) {
      eventObserver.on('error', observer.error);
    }
    if (observer.complete) {
      eventObserver.on('complete', observer.complete);
    }

    this.cleanup = this.producer(eventObserver);

    return this;
  }

  /**
   * The stream through a series of async middlewares
   * @param middlewares - An array of functions that take an middleware
   * @returns A new EmitStream with the result of applying the operators
   */
  use(
    ...middlewares: EmitMiddleware[]
  ): EmitStream {
    let stream: EmitStream = this;

    for (const middleware of middlewares) {
      stream = middleware(stream);
    }

    return stream;
  }

  /**
   * The async stream through a series of middlewares
   * @param middlewares - An array of functions that take an async middleware
   * @returns A new EmitStream with the result of applying the operators
   */
  async asyncUse(
    ...middlewares: EmitAsyncMiddleware[]
  ): Promise<EmitStream> {
    let stream: EmitStream = this;

    for (const middleware of middlewares) {
      stream = (await middleware)(stream);
    }

    return stream;
  }

  /**
   * Get the EmitObserver instance of the stream
   * @returns The EmitObserver instance
   */
  getObserver() {
    return this.emitObserver;
  }

  /**
   * Unsubscribes from the stream
   * @param {'error' | 'destroy' | 'complete'} option - An option to unlisten from the stream
   */
  unlisten(option?: Exclude<keyof EmitObserveStream, 'next'>): this {
    switch (option) {
      case 'error': {
        this.emitObserver.emit('error', 'Unsubscribed');
        break;
      }
      case 'destroy': {
        this.emitObserver.emit('destroy');
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
