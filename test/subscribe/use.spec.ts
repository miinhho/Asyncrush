import { RushStream } from "../../lib/stream/rush-stream";
import { RushSubscriber } from "../../lib/stream/rush-subscriber";

jest.useFakeTimers();

describe("RushSubscriber Use Middleware", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("should transform data with middleware", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockSub = jest.fn();
    const sub = new RushSubscriber<number>();

    sub.use(
      (value) => value + 3,
      (value) => value * 2,
      (value) => mockSub(value)
    ).subscribe(stream);

    stream.listen({
      next: () => {},
      complete: () => { },
    });

    expect(mockSub).toHaveBeenCalledTimes(1);
    expect(mockSub).toHaveBeenCalledWith(8);
    done();
  });
});
