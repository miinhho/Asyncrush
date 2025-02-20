import { EmitStream } from "@emiter/emit-stream";
import { useMiddleware } from "../middleware/use-middleware";

describe('Middleware', () => {
  test('should be chained in the correct order', () => {
    const results: number[] = [];
    const stream = new EmitStream<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
      observer.complete();

      return () => { };
    });

    stream.use(
      useMiddleware((value: number) => value * 2),
      useMiddleware((value: number) => value + 1),
      useMiddleware((value: number) => value * 3)
    ).then((middleware) => middleware.listen({
      next: (value) => results.push(value),
      complete: () => {
        expect(results).toEqual([9, 15, 21]);
      }
    }));
  });
});
