import { RushStream } from "../lib/stream/rush-stream";
import { RushSubscriber } from "../lib/stream/rush-subscriber";

jest.useFakeTimers();

describe('Subscribe to stream', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("should be only subscribed to one stream", (done) => {
    const stream1 = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const stream2 = new RushStream<number>((observer) => {
      observer.next(2);
    });

    const mockSub = jest.fn();
    const sub = new RushSubscriber<number>();

    sub.use((value) => mockSub(value)).subscribe(stream1);
    sub.subscribe(stream2);

    stream1.listen({
      next: () => { },
      complete: () => { },
    });
    stream2.listen({
      next: () => { },
      complete: () => { },
    });

    expect(mockSub).toHaveBeenCalledTimes(1);
    expect(mockSub).toHaveBeenCalledWith(2);
    done();
  });

  test("should unsubscribe from the stream", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockSub = jest.fn();
    const sub = new RushSubscriber<number>();

    sub.use((value) => mockSub(value)).subscribe(stream);
    sub.unsubscribe();

    stream.listen({
      next: () => { },
      complete: () => { },
    });

    expect(mockSub).not.toHaveBeenCalled();
    expect(stream.subscribers.size).toBe(0);
    done();
  });
});
