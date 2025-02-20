import { EmitObserver } from "@emiter/emit-observer";
import { EmitStream } from "@emiter/emit-stream";

/**
 * Filter operator for an EmitStream
 * @param predicate - A function that filters each value from the stream
 * @returns A function that takes an EmitStream and returns a new EmitStream that emits only the values that pass the predicate test
 */
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
