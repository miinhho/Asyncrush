import { RushStream, RushSubscriber } from "../../dist/lib";

jest.useFakeTimers();

describe("RushStream `debounce` method", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("should debounce events correctly", (done) => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        setTimeout(() => observer.next(1), 0);
        setTimeout(() => observer.next(2), 8);
        setTimeout(() => observer.next(3), 20);
      },
      { maxBufferSize: 3 }
    );

    const sub = new RushSubscriber<number>({ maxBufferSize: 3 }).use(mockNext);
    sub.subscribe(stream);
    sub.debounce(10);

    stream.listen({
      next: (value) => { },
      complete: () => { },
    });

    jest.advanceTimersByTime(20);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(2);
    jest.advanceTimersByTime(30);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(3);
    done();
  });

  test("debounce events even if throttle was set", (done) => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        setTimeout(() => observer.next(1), 0);
        setTimeout(() => observer.next(2), 8);
        setTimeout(() => observer.next(3), 20);
      });

    const sub = new RushSubscriber<number>({ maxBufferSize: 3 }).use(mockNext);
    sub.subscribe(stream);
    sub.throttle(10).debounce(10);

    stream.listen({
      next: (value) => { },
      complete: () => { },
    });

    jest.advanceTimersByTime(30);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(2);
    expect(mockNext).toHaveBeenCalledWith(3);
    done();
  });

  test("debounce events even if throttle was ran", (done) => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        setTimeout(() => observer.next(1), 0);
        setTimeout(() => observer.next(2), 8);
        setTimeout(() => observer.next(3), 20);
        setTimeout(() => observer.next(4), 25);
        setTimeout(() => observer.next(5), 40);
      });

    const sub = new RushSubscriber<number>({ maxBufferSize: 3 }).use(mockNext);
    sub.subscribe(stream);
    sub.throttle(10);

    stream.listen({
      next: (value) => { },
      complete: () => { },
    });

    setTimeout(() => {
      sub.debounce(10);
    }, 10);

    jest.advanceTimersByTime(40);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(1);
    expect(mockNext).toHaveBeenCalledWith(4);
    done();
  });
});
