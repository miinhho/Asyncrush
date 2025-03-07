import { RushStream, mergeStream } from "../../dist/lib";

jest.useFakeTimers();

describe("mergeStream", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("merges events from multiple streams", (done) => {
    const stream1 = new RushStream<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.complete();
      return () => {};
    });
    const stream2 = new RushStream<number>((observer) => {
      observer.next(3);
      observer.next(4);
      observer.complete();
      return () => {};
    });

    const merged = mergeStream(stream1, stream2);
    const mockNext = jest.fn();
    const mockComplete = jest.fn();

    merged.listen({
      next: mockNext,
      complete: mockComplete,
      error: (err) => { },
    });

    expect(mockNext).toHaveBeenCalledWith(1);
    expect(mockNext).toHaveBeenCalledWith(2);
    expect(mockNext).toHaveBeenCalledWith(3);
    expect(mockNext).toHaveBeenCalledWith(4);
    expect(mockNext).toHaveBeenCalledTimes(4);
    done();
  });

  test("handles error from one stream", (done) => {
    const stream1 = new RushStream<number>((observer) => {
      observer.next(1);
      observer.error(new Error("Stream 1 failed"));
      return () => {};
    });
    const stream2 = new RushStream<number>((observer) => {
      observer.next(2);
      observer.complete();
      return () => {};
    });

    const merged = mergeStream(stream1, stream2);
    const mockError = jest.fn();

    merged.listen({
      next: () => {},
      complete: () => {},
      error: (err) => {
        mockError(err);
        expect(mockError).toHaveBeenCalledWith(expect.any(Error));
      },
    });

    jest.advanceTimersByTime(1);
    done();
  });

  test("unsubscribes correctly", (done) => {
    const unsubscribe1 = jest.fn();
    const unsubscribe2 = jest.fn();
    const stream1 = new RushStream<number>((observer) => {
      observer.next(1);
      return unsubscribe1;
    });
    const stream2 = new RushStream<number>((observer) => {
      observer.next(2);
      return unsubscribe2;
    });

    const merged = mergeStream(stream1, stream2);
    const subscription = merged.listen({
      next: () => {},
      complete: () => {},
      error: () => {},
    });

    subscription.unlisten();

    jest.advanceTimersByTime(5);
    expect(unsubscribe1).toHaveBeenCalled();
    expect(unsubscribe2).toHaveBeenCalled();
    done();
  });
});
