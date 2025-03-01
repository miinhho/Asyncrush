import { RushStream } from "../lib/stream/rush-stream";

jest.useFakeTimers();

describe("RushStream `debounce` method", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("should debounce events correctly", done => {
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
});
