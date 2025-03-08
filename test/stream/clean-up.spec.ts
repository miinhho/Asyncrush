import { RushStream, RushSubscriber } from "../../lib";

describe('cleanup', () => {
  test('should clean up resources on unlisten', () => {
    const cleanupSpy = jest.fn();
    const stream = new RushStream(() => cleanupSpy);

    stream.listen({});
    stream.unlisten();

    expect(cleanupSpy).toHaveBeenCalledTimes(1);
  });

  test('should complete stream', () => {
    const completeSpy = jest.fn();
    const stream = new RushStream(() => {});

    const sub = new RushSubscriber();
    const subCompleteSpy = jest.fn();
    sub.onComplete(subCompleteSpy);

    stream.subscribe(sub).listen({
      complete: completeSpy
    }).unlisten('complete');

    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(subCompleteSpy).toHaveBeenCalledTimes(1);
  });

  test('should destroy stream', () => {
    const completeSpy = jest.fn();
    const stream = new RushStream(() => {});

    stream.listen({
      complete: completeSpy
    });

    stream.unlisten('destroy');

    expect(completeSpy).not.toHaveBeenCalled();
  });

  test('should handle errors in cleanup function', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const stream = new RushStream(() => {
      return () => {
        throw new Error('Cleanup error');
      };
    });

    stream.listen({});
    stream.unlisten();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Asyncrush] Error in cleanup function:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
