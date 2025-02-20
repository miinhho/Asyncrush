import { EmitObserver } from "@emiter/emit-observer";
import { EmitStream } from "@emiter/emit-stream";
import { EmitMiddleware } from "./middleware.types";

/**
 * Creates a middleware that transforms the value of a stream
 * @param fn - A function that takes a value and returns a new value to stream
 * @returns
 */
export async function useMiddleware(fn: (value: any) => any): EmitMiddleware {
  return (source: EmitStream) =>
    new EmitStream((observer: EmitObserver) => {
      const listener = source.listen({
        next: (value: any) => {
          try {
            const result = fn(value);
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
