import { RushStream, RushSubscriber } from "../../dist/lib";

jest.useFakeTimers();

describe("Subscriber Retry when error", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("retry subscriber middleware error", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    }, { continueOnError: true });

    let attempt = 0;
    const nextFn = jest.fn();
    const sub = new RushSubscriber<number>({ continueOnError: true });
    sub
      .use([(value) => {
        attempt++;
        if (attempt < 3) throw new Error("retry");
        return value * 2;
      }, (value) => {
        return nextFn(value);
        }], {
          retries: 2,
          retryDelay: 1,
          delayFn: (attempt, retryDelay) => retryDelay
      })
      .onError((error) => {})
      .subscribe(stream);

    stream.listen({ next: (value) => { } });

    jest.advanceTimersByTime(10);
    expect(attempt).toBe(3);
    expect(nextFn).toHaveBeenCalledWith(2);
    done();
  });
});
