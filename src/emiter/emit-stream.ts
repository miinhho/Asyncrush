import { StreamListener } from "../listen/stream-listener.interface";
import { EmitObserver } from "./emit-observer";

export class EmitStream<T> {
  constructor(
    private producer: (observer: EmitObserver<T>) => () => void
  ) { }

  listen(observer: Partial<EmitObserver<T>>): StreamListener {
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
    }
  }

  pipe<R>(...operators: Array<(source: EmitStream<any>) => EmitStream<any>>): EmitStream<any> {
    return operators.reduce(
      (prev, operator) => operator(prev), this as unknown as EmitStream<any>
    ) as EmitStream<R>;
  }
}
