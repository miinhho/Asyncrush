import { RushStream } from "../../lib";

jest.useFakeTimers();

describe("RushStream retry", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("retry stream middleware error", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    }, { continueOnError: true });

    const nextFn = jest.fn();

    let attempt = 0;
    stream
      .use([(value) => {
        attempt++;
        if (attempt < 3) throw new Error("retry");
        return value * 2;
      }, (value) => {
        return nextFn(value);
      }], {
        retries: 3,
        retryDelay: 1,
        delayFn: (attempt, retryDelay) => retryDelay
      })
      .listen({
        next: (value) => { nextFn(value); },
        error: (error) => { }
      });

    jest.advanceTimersByTime(10);
    expect(attempt).toBe(3);
    expect(nextFn).toHaveBeenCalledWith(2);
    done();
  });
});
