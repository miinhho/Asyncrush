import { RushStream } from "../../lib/stream/rush-stream";

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
        setTimeout(() => observer.next(2), 80);
        setTimeout(() => observer.next(3), 200);
      },
      { maxBufferSize: 3 }
    );

    stream.debounce(100).listen({
      next: (value) => {
        mockNext(value);
      },
      complete: () => {
      },
    });

    jest.advanceTimersByTime(200);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(2);
    jest.advanceTimersByTime(300);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(3);
    done();
  });

  test("should debounce events even if throttle was set", (done) => {
    const mockNext = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        setTimeout(() => observer.next(1), 0);
        setTimeout(() => observer.next(2), 80);
        setTimeout(() => observer.next(3), 200);
      });

    stream
      .throttle(100)
      .debounce(100)
      .listen({
      next: (value) => {
        mockNext(value);
      },
      complete: () => { },
    });

    jest.advanceTimersByTime(300);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(2);
    expect(mockNext).toHaveBeenCalledWith(3);
    done();
  });

  test("should debounce events even if throttle was ran", async () => {
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

    setTimeout(() => {
      stream.debounce(10);
    }, 10);

    jest.advanceTimersByTime(40);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(1);
    expect(mockNext).toHaveBeenCalledWith(4);
  });
});
