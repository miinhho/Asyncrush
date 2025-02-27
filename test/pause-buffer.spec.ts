import { RushStream } from "../lib/stream/rush-stream";

jest.useFakeTimers();

describe('RushStream `pause` method', () => {
  test("should buffer events during pause and flush on resume, then complete on unlisten", done => {
    const mockNext = jest.fn();
    const mockComplete = jest.fn();

    const stream = new RushStream<number>(
      observer => {
        observer.next(1);
        observer.next(2);
      },
      { maxBufferSize: 2 }
    );

    stream.pause().listen({
      next: (value) => {
        mockNext(value);
      },
      complete: mockComplete,
    });

    expect(mockNext).not.toHaveBeenCalled();

    setTimeout(() => {
      stream.resume();
    }, 10);

    setTimeout(() => {
      stream.unlisten("complete");
    }, 300);

    jest.advanceTimersByTime(11);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(1);
    expect(mockNext).toHaveBeenCalledWith(2);
    expect(mockComplete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(290);
    expect(mockComplete).toHaveBeenCalledTimes(1);

    done();
  });
});
