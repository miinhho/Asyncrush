import { EmitListener } from "@listen/emit-listener.interface";
import { EmitObserver } from "./emit-observer";

/**
 * Stream that emits values, errors, and completion events
 */
export class EmitStream<T> {
  /**
   * @param producer - A function that takes an EmitObserver and returns a cleanup function
   */
  constructor(
    private producer: (observer: EmitObserver<T>) => () => void
  ) { }

  /**
   * Subscribes an observer to the stream
   * @param observer - An object with optional next, error, and complete methods
   * @returns An EmitListener with an unlisten method to unsubscribe
   */
  listen(observer: Partial<EmitObserver<T>>): EmitListener {
    const eventObserver = new EmitObserver<T>();

    if (observer.next) {
      eventObserver.on('next', observer.next);
    }
    if (observer.error) {
      eventObserver.on('error', observer.error);
    }
    if (observer.complete) {
      eventObserver.on('complete', observer.complete);
    }

    const cleanup = this.producer(eventObserver);
    return {
      unlisten: () => {
        cleanup();
        eventObserver.removeAllListeners();
      }
    };
  }

  /**
   * Pipes the stream through a series of operators
   * @param operators - An array of functions that take an EmitStream and return a new EmitStream
   * @returns A new EmitStream with the result of applying the operators
   */
  pipe<R>(...operators: Array<(source: EmitStream<any>) => EmitStream<any>>): EmitStream<any> {
    return operators.reduce(
      (prev, operator) => operator(prev), this as unknown as EmitStream<any>
    ) as EmitStream<R>;
  }
}
