import { RushObserver } from '../../lib';

describe('error handling', () => {
  test('should destroy observer on error by default', () => {
    const observer = new RushObserver();
    observer.error(new Error('Test error'));
    expect(observer.isDestroyed()).toBe(true);
  });

  test('should continue after error when configured', () => {
    const observer = new RushObserver({ continueOnError: true });
    const nextSpy = jest.fn();

    observer.onNext(nextSpy);
    observer.error(new Error('Test error'));

    expect(observer.isDestroyed()).toBe(false);

    observer.next('test');
    expect(nextSpy).toHaveBeenCalledWith('test');
  });

  test('should catch errors in next handlers', () => {
    const observer = new RushObserver();
    const errorSpy = jest.fn();
    const testError = new Error('Handler error');

    observer.onError(errorSpy);
    observer.onNext(() => {
      throw testError;
    });

    observer.next('test');

    expect(errorSpy).toHaveBeenCalledWith(testError);
  });

  test('should handle errors in error handlers', () => {
    const observer = new RushObserver();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    observer.onError(() => {
      throw new Error('Error in error handler');
    });

    observer.error(new Error('Original error'));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Asyncrush] Error in error handler:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  test('should handle errors in complete handlers', () => {
    const observer = new RushObserver();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    observer.onComplete(() => {
      throw new Error('Error in complete handler');
    });

    observer.complete();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Asyncrush] Error in complete handler:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
