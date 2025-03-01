import { RushStream } from "../../lib/stream/rush-stream";

jest.useFakeTimers();

describe("RushStream Throttle", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("should throttle events correctly", done => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        setTimeout(() => observer.next(1), 0);
        setTimeout(() => observer.next(2), 80);
        setTimeout(() => observer.next(3), 200);
      });

    stream.throttle(100).listen({
      next: (value) => {
        mockNext(value);
      },
      complete: () => { },
    });

    jest.advanceTimersByTime(300);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(1);
    expect(mockNext).toHaveBeenCalledWith(3);
    done();
  });

  test("should throttle events even if debounce was set", done => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        setTimeout(() => observer.next(1), 0);
        setTimeout(() => observer.next(2), 80);
        setTimeout(() => observer.next(3), 200);
      });

    stream.debounce(100).throttle(100).listen({
      next: (value) => {
        mockNext(value);
      },
      complete: () => { },
    });

    jest.advanceTimersByTime(300);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(1);
    expect(mockNext).toHaveBeenCalledWith(3);
    done();
  });

  test("should throttle events even if debounce was ran", async () => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        setTimeout(() => observer.next(1), 0);
        setTimeout(() => observer.next(2), 8);
        setTimeout(() => observer.next(3), 20);
        setTimeout(() => observer.next(4), 31);
      });

    stream.debounce(10).listen({
      next: (value) => {
        mockNext(value);
      },
      complete: () => { },
    });

    setTimeout(() => {
      stream.throttle(10);
    }, 10);

    jest.advanceTimersByTime(31);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(3);
    expect(mockNext).toHaveBeenCalledWith(4);
  });
});
