import { RushStream, RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe('cleanup', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it("should complete subscriber", () => {
    const completeSpy = jest.fn();
    const sub = new RushSubscriber();

    sub.onComplete(completeSpy);
    sub.complete();

    expect(completeSpy).toHaveBeenCalled();
  });

  it("should destroy subscriber", () => {
    const nextSpy = jest.fn();
    const sub = new RushSubscriber();

    sub.onNext(nextSpy);
    sub.destroy();

    sub.next(1);
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('should not process events when inactive', () => {
    const subscriber = new RushSubscriber<number>();
    const nextSpy = jest.fn();

    subscriber.onNext(nextSpy);
    subscriber.destroy();

    subscriber.next(1);
    subscriber.next(2);

    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('should not add handlers when inactive', () => {
    const subscriber = new RushSubscriber<number>();
    const nextSpy = jest.fn();
    const completeSpy = jest.fn();
    const errorSpy = jest.fn();

    subscriber.destroy();

    subscriber.onNext(nextSpy);
    subscriber.onComplete(completeSpy);
    subscriber.onError(errorSpy);

    subscriber.next(1);
    subscriber.complete();
    subscriber.error(new Error('test error'));

    expect(nextSpy).not.toHaveBeenCalled();
    expect(completeSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('should not subscribe to stream when inactive', () => {
    const subscriber = new RushSubscriber<number>();
    const stream = new RushStream<number>(() => {});

    subscriber.destroy();
    subscriber.subscribe(stream);

    expect(stream.subscribers.has(subscriber)).toBe(false);
  });

  it('should not apply middleware when inactive', () => {
    const subscriber = new RushSubscriber<number>();
    const middlewareSpy = jest.fn();

    subscriber.destroy();
    subscriber.use(middlewareSpy);
    subscriber.next(1);

    expect(middlewareSpy).not.toHaveBeenCalled();
  });

  it('should not apply time control when inactive', () => {
    const subscriber = new RushSubscriber<number>();
    const nextSpy = jest.fn();

    subscriber.onNext(nextSpy);
    subscriber.destroy();

    subscriber.debounce(10);
    subscriber.next(1);

    jest.advanceTimersByTime(10);

    expect(nextSpy).not.toHaveBeenCalled();
  });
});
