import { RushStream } from "../lib/stream/rush-stream";

jest.useFakeTimers();

describe("RushStream `Throttle` method", () => {
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
});
