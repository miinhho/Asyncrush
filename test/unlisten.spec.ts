import { RushStream } from "../lib/stream/rush-stream";

describe('RushStream `unlisten` method', () => {
  test("unlisten should call clean up function", (done) => {
    const message = 'unlisten';
    const stream = new RushStream<number>((observer) => {
      observer.next(1);

      return () => {
        expect(message).toBe('unlisten');
        done();
      }
    });

    stream
      .use((v) => v)
      .listen({
        next: (value) => { },
        complete: () => {},
      });

    stream.unlisten();
  });
});
