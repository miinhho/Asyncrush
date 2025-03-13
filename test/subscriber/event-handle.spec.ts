import { RushSubscriber } from "../../lib";

describe('event handling', () => {
  it('should call next handlers with value', () => {
    const subscriber = new RushSubscriber<string>();
    const nextSpy = jest.fn();

    subscriber.onNext(nextSpy);
    subscriber.next('test-event');

    expect(nextSpy).toHaveBeenCalledWith('test-event');
  });

  it('should call error handlers with error', () => {
    const subscriber = new RushSubscriber();
    const errorSpy = jest.fn();
    const testError = new Error('Test error');

    subscriber.onError(errorSpy);
    subscriber.error(testError);

    expect(errorSpy).toHaveBeenCalledWith(testError);
  });

  it('should call complete handlers', () => {
    const subscriber = new RushSubscriber();
    const completeSpy = jest.fn();

    subscriber.onComplete(completeSpy);
    subscriber.complete();

    expect(completeSpy).toHaveBeenCalled();
    expect(subscriber.isDestroyed()).toBe(true);
  });

  it('should not call handlers after destroy', () => {
    const subscriber = new RushSubscriber<string>();
    const nextSpy = jest.fn();
    const errorSpy = jest.fn();
    const completeSpy = jest.fn();

    subscriber.onNext(nextSpy);
    subscriber.onError(errorSpy);
    subscriber.onComplete(completeSpy);

    subscriber.destroy();

    subscriber.next('test');
    subscriber.error(new Error('Test error'));
    subscriber.complete();

    expect(nextSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(completeSpy).not.toHaveBeenCalled();
  });
});
