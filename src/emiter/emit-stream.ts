import { EmitMiddleware } from "@middleware/middleware.types";
import { EmitObserver } from "./emit-observer";
import { EmitListener, EmitObserveStream } from "./emit-observer.types";

/**
 * Stream that emits values, errors, and completion events
 */
export class EmitStream {
  private emitObserver: EmitObserver;
  private readonly middlewares: EmitMiddleware[] = [];

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
   * @returns An EmitListener with an unlisten method to unsubscribe
   */
  listen(observer: EmitObserveStream): EmitListener {
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

    return {
      unlisten: () => {
        this.unlisten('destroy');
      }
    };
  }

  /**
   * The stream through a series of operators
   * @param middlewares - An array of functions that take an EmitStream and return a new EmitStream
   * @returns A new EmitStream with the result of applying the operators
   */
  async use(
    ...middlewares: EmitMiddleware[]
  ): Promise<EmitStream> {
    let stream: EmitStream = this;

    this.middlewares.push(...middlewares);
    for (const middleware of this.middlewares) {
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
  unlisten(option?: Exclude<keyof EmitObserveStream, 'next'>) {
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
  }
}
