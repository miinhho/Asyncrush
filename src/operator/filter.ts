import { EmitObserver } from "@emiter/emit-observer";
import { EmitStream } from "@emiter/emit-stream";

export function filter<T>(predicate: (value: T) => boolean) {
  return (source: EmitStream<T>) =>
    new EmitStream<T>((observer: EmitObserver<T>) => {
      const listener = source.listen({
        next: (value: T) => {
          try {
            if (predicate(value)) {
              observer.next(value);
            }
          } catch (err) {
            observer.error(err);
          }
        },
        error: (err: any) => observer.error(err),
        complete: () => observer.complete()
      });
      return listener.unlisten;
    });
}
