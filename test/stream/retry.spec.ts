import { RushStream, RushSubscriber } from "../../dist/lib";

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
        next: (value) => { },
        error: (error) => { }
      });

    jest.advanceTimersByTime(10);
    expect(attempt).toBe(3);
    expect(nextFn).toHaveBeenCalledWith(2);
    done();
  });

  test("retry stream middleware error with subscriber", (done) => {
    const nextFn = jest.fn();
    const subNextFn = jest.fn();
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    }, { continueOnError: true });
    const sub = new RushSubscriber<number>
      ({ continueOnError: true }).use((value) => {
        subNextFn(value);
        return value;
      });

    let attempt = 0;
    stream
      .subscribe(sub)
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
        next: (value) => { },
        error: (error) => { }
      });

    jest.advanceTimersByTime(10);
    expect(attempt).toBe(3);
    expect(subNextFn).not.toHaveBeenCalled();
    expect(nextFn).toHaveBeenCalledWith(2);
    done();
  });
});
