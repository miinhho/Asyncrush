import { RushStream, RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe("RushSubscriber's Buffer & Pause, Resume", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("buffer events during pause and flush on resume", (done) => {
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

  test("latest buffer removed first", async () => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        observer.next(1);
        observer.next(2);
        observer.next(3);
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
    expect(mockNext).toHaveBeenCalledWith(2);
    expect(mockNext).toHaveBeenCalledWith(3);
  });
});
