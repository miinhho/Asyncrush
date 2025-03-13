import { RushObserver } from '../../lib';

describe('initialization', () => {
  it('should create with default options', () => {
    const observer = new RushObserver();
    expect(observer.isDestroyed()).toBe(false);
  });

  it('should set continueOnError from options', () => {
    const observer = new RushObserver({ continueOnError: true });
    const errorSpy = jest.fn();

    observer.onError(errorSpy);
    observer.onNext(() => {
      throw new Error('Test error');
    });

    observer.next('test');

    expect(errorSpy).toHaveBeenCalled();
    expect(observer.isDestroyed()).toBe(false);
  });
});
