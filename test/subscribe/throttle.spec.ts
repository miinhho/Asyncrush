import { RushStream, RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe("RushStream Throttle", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("throttle events", (done) => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        setTimeout(() => observer.next(1), 0);
        setTimeout(() => observer.next(2), 8);
        setTimeout(() => observer.next(3), 20);
      });

    const sub = new RushSubscriber<number>().use(mockNext);
    sub.subscribe(stream);
    sub.throttle(10);

    stream.listen({
      next: (value) => {},
      complete: () => { },
    });

    jest.advanceTimersByTime(30);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(1);
    expect(mockNext).toHaveBeenCalledWith(3);
    done();
  });

  test("throttle events even if debounce was set", (done) => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        setTimeout(() => observer.next(1), 0);
        setTimeout(() => observer.next(2), 8);
        setTimeout(() => observer.next(3), 20);
      });

    const sub = new RushSubscriber<number>().use(mockNext);
    sub.subscribe(stream);
    sub.debounce(10).throttle(10);

    stream.listen({
      next: (value) => { },
      complete: () => { },
    });

    jest.advanceTimersByTime(30);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(1);
    expect(mockNext).toHaveBeenCalledWith(3);
    done();
  });

  test("throttle events even if debounce was ran", (done) => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        setTimeout(() => observer.next(1), 0);
        setTimeout(() => observer.next(2), 8);
        setTimeout(() => observer.next(3), 20);
        setTimeout(() => observer.next(4), 31);
      });

    const sub = new RushSubscriber<number>().use(mockNext);
    sub.subscribe(stream);
    sub.debounce(10);

    stream.listen({
      next: (value) => { },
      complete: () => { },
    });

    setTimeout(() => {
      sub.throttle(10);
    }, 10);

    jest.advanceTimersByTime(31);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(3);
    expect(mockNext).toHaveBeenCalledWith(4);
    done();
  });
});
