import { RushObserver, RushStream, RushSubscriber } from "../../lib";

describe('cleanup', () => {
  it('should clean up resources on unlisten', () => {
    const cleanupSpy = jest.fn();
    const stream = new RushStream(() => cleanupSpy);

    stream.listen({});
    stream.unlisten();

    expect(cleanupSpy).toHaveBeenCalledTimes(1);
  });

  it('should complete stream', () => {
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

  it('should destroy stream', () => {
    const completeSpy = jest.fn();
    const stream = new RushStream(() => {});

    stream.listen({
      complete: completeSpy
    });

    stream.unlisten('destroy');

    expect(completeSpy).not.toHaveBeenCalled();
  });

  it('should handle errors in cleanup function', () => {
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

  it('should not emit events when stream is destroyed', () => {
    const nextSpy = jest.fn();
    let sourceObserver: RushObserver<number>;

    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    });

    stream.listen({
      next: nextSpy
    });
    stream.unlisten('destroy');

    sourceObserver!.next(1);
    sourceObserver!.next(2);
    expect(nextSpy).not.toHaveBeenCalled();
  });

  it('should not subscribe when stream is destroyed', () => {
    const stream = new RushStream<number>(() => { });
    const sub = new RushSubscriber();

    stream.subscribe(sub);
    stream.unlisten('destroy');
    expect(stream.subscribers.size).toBe(0);
  });
});
