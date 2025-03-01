import { RushStream } from "../lib/stream/rush-stream";
import { RushSubscriber } from "../lib/stream/rush-subscriber";

jest.useFakeTimers();

describe('RushSubscriber', () => {
  test("should broadcast events to multiple subscribers", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockSub1 = jest.fn();
    const mockSub2 = jest.fn();
    const sub1 = new RushSubscriber<any>();
    const sub2 = new RushSubscriber<number>();

    sub1.use((value) => mockSub1(value));
    sub2.use((value) => mockSub2(value));

    stream.subscribe(sub1, sub2);
    stream.listen({
      next: () => {},
      complete: () => { },
    });

    expect(mockSub1).toHaveBeenCalledTimes(1);
    expect(mockSub1).toHaveBeenCalledWith(1);
    expect(mockSub2).toHaveBeenCalledTimes(1);
    expect(mockSub2).toHaveBeenCalledWith(1);
    done();
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

  test("should buffer events during pause and flush on resume", (done) => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        observer.next(1);
        observer.next(2);
    });

    const sub = new RushSubscriber<number>({ maxBufferSize: 2 })
      .pause()
      .use((value) => mockNext(value));

    stream
      .subscribe(sub)
      .listen({
      next: (value) => { },
      complete: () => { },
    });

    expect(mockNext).not.toHaveBeenCalled();

    setTimeout(() => {
      sub.resume();
    }, 10);

    jest.advanceTimersByTime(11);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(1);
    expect(mockNext).toHaveBeenCalledWith(2);
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
