import { EmitObserver } from "@emiter/emit-observer";
import { EmitStream } from "@emiter/emit-stream";

export function map<T, R>(project: (value: T) => R) {
  return (source: EmitStream<T>) =>
    new EmitStream<R>((observer: EmitObserver<R>) => {
      const listener = source.listen({
        next: (value: T) => {
          try {
            const result = project(value);
            observer.next(result);
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
