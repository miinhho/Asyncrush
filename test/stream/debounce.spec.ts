import { RushStream } from "../../lib";

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

    stream.debounce(10).listen({
      next: (value) => {
        mockNext(value);
      },
      complete: () => {
      },
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

    stream
      .throttle(10)
      .debounce(10)
      .listen({
      next: (value) => {
        mockNext(value);
      },
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

    stream.throttle(10).listen({
      next: (value) => {
        mockNext(value);
      },
      complete: () => { },
    });

    jest.advanceTimersByTime(10);
    stream.debounce(10);

    jest.advanceTimersByTime(30);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(1);
    expect(mockNext).toHaveBeenCalledWith(4);
    done();
  });
});
