import { RushObserver, RushStream } from "../../lib";

jest.useFakeTimers();

describe('flow control', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test('should pause and resume', () => {
    const nextSpy = jest.fn();
    let sourceObserver: RushObserver<number>;

    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    });

    stream.listen({
      next: nextSpy
    });

    sourceObserver!.next(1);
    expect(nextSpy).toHaveBeenCalledWith(1);

    stream.pause();
    sourceObserver!.next(2);
    expect(nextSpy).toHaveBeenCalledTimes(1);

    stream.resume();
    sourceObserver!.next(3);
    expect(nextSpy).toHaveBeenCalledTimes(2);
    expect(nextSpy).toHaveBeenCalledWith(3);
  });

  test('should throttle events', () => {
    const nextSpy = jest.fn();
    let sourceObserver: RushObserver<number>;

    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    });

    stream.listen({
      next: nextSpy
    });

    stream.throttle(10);

    sourceObserver!.next(1);
    sourceObserver!.next(2);

    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledWith(1);

    jest.advanceTimersByTime(10);
    sourceObserver!.next(3);
    expect(nextSpy).toHaveBeenCalledTimes(2);
    expect(nextSpy).toHaveBeenLastCalledWith(3);

  });

  test('should debounce events', () => {
    const nextSpy = jest.fn();
    let sourceObserver: RushObserver<number>;

    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    });

    stream.listen({
      next: nextSpy
    });

    stream.debounce(10);
    sourceObserver!.next(1);
    expect(nextSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5);
    sourceObserver!.next(2);
    expect(nextSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10);
    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledWith(2);
  });
});
