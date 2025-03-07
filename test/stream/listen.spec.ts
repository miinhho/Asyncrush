import { RushStream } from "../../dist/lib";

jest.useFakeTimers();

describe('RushStream Listening', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("receive events and chain handlers", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    stream
      .listen({
        next: (value) => {
          expect(value).toBe(1);
          done();
        },
        complete: () => { },
      });
  });
});
