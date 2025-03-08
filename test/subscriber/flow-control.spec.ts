import { RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe('flow control', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test('should pause and resume', () => {
    const subscriber = new RushSubscriber<string>();
    const nextSpy = jest.fn();

    subscriber.onNext(nextSpy);

    subscriber.next('event1');
    expect(nextSpy).toHaveBeenCalledWith('event1');

    subscriber.pause();
    subscriber.next('event2');
    expect(nextSpy).toHaveBeenCalledTimes(2);

    subscriber.resume();
    subscriber.next('event3');
    expect(nextSpy).toHaveBeenCalledTimes(3);
    expect(nextSpy).toHaveBeenLastCalledWith('event3');
  });

  test('should throttle events', () => {
    const subscriber = new RushSubscriber<string>();
    const nextSpy = jest.fn();

    subscriber.onNext(nextSpy);
    subscriber.throttle(100);

    subscriber.next('event1');
    subscriber.next('event2');

    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledWith('event1');

    jest.advanceTimersByTime(100);

    subscriber.next('event3');
    expect(nextSpy).toHaveBeenCalledTimes(2);
    expect(nextSpy).toHaveBeenLastCalledWith('event3');

  });

  test('should debounce events', () => {
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
});
