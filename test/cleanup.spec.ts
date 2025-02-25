import { RushStream } from "../lib/stream/rush-stream";

jest.useFakeTimers();

describe("cleanup", () => {
  test("should call cleanup", (done) => {
    let num = 0;
    const stream = new RushStream<number>((observer) => {
      observer.next(1);

      return () => {
        num = 1;
      }
    });

    stream
      .listen({
        next: (value) => { },
        complete: () => { },
      });

    setTimeout(() => {
      stream.unlisten();
    }, 10);

    jest.advanceTimersByTime(11);
    expect(num).toBe(1);
    done();
  });
})
