import { EmitObserver } from "@emiter/emit-observer";
import { EmitStream } from "@emiter/emit-stream";
import { EmitAsyncMiddleware, EmitMiddleware } from "./middleware.types";

/**
 * Creates a middleware that transforms the value of a stream
 * @param fn - A function that takes a value and returns a new value to stream
 * @param isAsync - A flag to determine whether the function is async
 */
function useTransformMiddleware(fn: (value: any) => any, isAsync: boolean): EmitMiddleware {
  return (source: EmitStream) =>
    new EmitStream((observer: EmitObserver) => {
      const listener = source.listen({
        next: async (value: any) => {
          try {
            const result = isAsync ? await fn(value) : fn(value);
            observer.next(result);
          } catch (err) {
            observer.error(err);
          }
        },
        error: (err: any) => observer.error(err),
        complete: () => observer.complete()
      });

      return () => {
        listener.unlisten('complete');
      };
    });
}

/**
 * Creates a middleware for EmitStream
 * @param fn - A function that takes a value and returns a new value to stream
 */
export function useMiddleware(fn: (value: any) => any): EmitMiddleware {
  return useTransformMiddleware(fn, false);
}

/**
 * Creates a async middleware for EmitStream
 * @param fn - A function that takes a value and returns a new value to stream
 */
export async function useAsyncMiddleware(fn: (value: any) => any): EmitAsyncMiddleware {
  return useTransformMiddleware(fn, true);
}
