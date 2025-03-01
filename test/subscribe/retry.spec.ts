import { RushStream } from "../../lib/stream/rush-stream";
import { RushSubscriber } from "../../lib/stream/rush-subscriber";

jest.useFakeTimers();

describe("Subscriber Retry when error", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("retries subscriber middleware error", async () => {
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
          retryDelay: 10,
          delayFn: (attempt, retryDelay) => retryDelay
        }).subscribe(stream);

    stream.listen({ next: (value) => { } });

    jest.advanceTimersByTime(60);
    setImmediate(() => {
      expect(attempt).toBe(3);
      expect(nextFn).toHaveBeenCalledWith(2);
    });
  });
});
