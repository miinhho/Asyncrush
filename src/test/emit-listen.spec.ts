import { EmitStream } from "@emiter/emit-stream";

describe('EmitListener', () => {
  test('should allow unsubscribe before complete', (done) => {
    let count = 0;

    const listener = new EmitStream<number>((observer) => {
      const interval = setInterval(() => {
        observer.next(++count);
      }, 2);

      return () => clearInterval(interval);
    }).listen({
      next: (value) => {
        if (value === 2) {
          listener.unlisten();
          setTimeout(() => {
            expect(count).toBe(2);
            done();
          }, 6);
        }
      }
    });
  });
});
