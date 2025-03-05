import { RushStream, RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe('RushSubscriber subscribe', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("only subscribed to one stream", (done) => {
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
    expect(stream1.subscribers.size).toBe(0);
    expect(stream2.subscribers.size).toBe(1);
    expect(sub.stream).toBe(stream2);
    done();
  });

  test("unsubscribe from the stream", (done) => {
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
