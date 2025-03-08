import { RushObserver } from '../../lib';

describe('event handling', () => {
  test('should call next handlers with provided value', () => {
    const observer = new RushObserver<string>();
    const nextSpy = jest.fn();

    observer.onNext(nextSpy);
    observer.next('test-value');

    expect(nextSpy).toHaveBeenCalledWith('test-value');
  });

  test('should call error handlers with provided error', () => {
    const observer = new RushObserver();
    const errorSpy = jest.fn();
    const testError = new Error('Test error');

    observer.onError(errorSpy);
    observer.error(testError);

    expect(errorSpy).toHaveBeenCalledWith(testError);
  });

  test('should call complete handlers', () => {
    const observer = new RushObserver();
    const completeSpy = jest.fn();

    observer.onComplete(completeSpy);
    observer.complete();

    expect(completeSpy).toHaveBeenCalled();
    expect(observer.isDestroyed()).toBe(true);
  });

  test('should not call handlers after destroy', () => {
    const observer = new RushObserver<string>();
    const nextSpy = jest.fn();
    const errorSpy = jest.fn();
    const completeSpy = jest.fn();

    observer.onNext(nextSpy);
    observer.onError(errorSpy);
    observer.onComplete(completeSpy);

    observer.destroy();

    observer.next('test');
    observer.error(new Error('Test error'));
    observer.complete();

    expect(nextSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(completeSpy).not.toHaveBeenCalled();
  });
});
