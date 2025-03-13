import { RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe('flow control', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should pause and resume', () => {
    const subscriber = new RushSubscriber<string>();
    const nextSpy = jest.fn();

    subscriber.onNext(nextSpy);

    subscriber.next('event1');
    expect(nextSpy).toHaveBeenCalledWith('event1');

    subscriber.pause();
    subscriber.next('event2');
    expect(nextSpy).toHaveBeenCalledTimes(1);

    subscriber.resume();
    subscriber.next('event3');
    expect(nextSpy).toHaveBeenCalledTimes(2);
    expect(nextSpy).toHaveBeenLastCalledWith('event3');
  });

  it('should throttle events', () => {
    const subscriber = new RushSubscriber<string>();
    const nextSpy = jest.fn();

    subscriber.onNext(nextSpy);
    subscriber.throttle(10);

    subscriber.next('event1');
    subscriber.next('event2');

    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledWith('event1');

    jest.advanceTimersByTime(10);

    subscriber.next('event3');
    expect(nextSpy).toHaveBeenCalledTimes(2);
    expect(nextSpy).toHaveBeenLastCalledWith('event3');

  });

  it('should debounce events', () => {
    const subscriber = new RushSubscriber<string>();
    const nextSpy = jest.fn();

    subscriber.onNext(nextSpy);
    subscriber.debounce(10);

    subscriber.next('event1');
    expect(nextSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5);
    subscriber.next('event2');
    expect(nextSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10);
    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledWith('event2');
  });

  it('should clear previous time control when setting a new one', () => {
    const subscriber = new RushSubscriber<number>();
    const nextSpy = jest.fn();

    subscriber.onNext(nextSpy);
    subscriber.debounce(10);

    subscriber.next(1);
    subscriber.throttle(50);

    jest.advanceTimersByTime(10);
    expect(nextSpy).not.toHaveBeenCalled();

    subscriber.next(2);
    expect(nextSpy).toHaveBeenCalledWith(2);
  });

  it('should handle undefined temp value in debounce', () => {
    const subscriber = new RushSubscriber<number | undefined>();
    const nextSpy = jest.fn();

    subscriber.onNext(nextSpy);
    subscriber.debounce(10);

    subscriber.next(undefined);

    jest.advanceTimersByTime(10);
    expect(nextSpy).not.toHaveBeenCalled();
  });
});
