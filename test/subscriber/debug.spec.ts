import { RushStream, RushSubscriber } from "../../lib";

describe('debugging', () => {
  test('should call debug hooks on events', () => {
    const debugHook = {
      onEmit: jest.fn(),
      onError: jest.fn(),
      onSubscribe: jest.fn(),
      onUnsubscribe: jest.fn(),
      onUnlisten: jest.fn()
    };

    const subscriber = new RushSubscriber<string>({
      debugHook,
      continueOnError: true
    });

    const stream = new RushStream<string>(() => {});

    subscriber.subscribe(stream);
    subscriber.next('test');
    subscriber.error(new Error('Test error'));
    subscriber.unsubscribe();
    subscriber.destroy();

    expect(debugHook.onEmit).toHaveBeenCalledWith('test');
    expect(debugHook.onError).toHaveBeenCalledWith(expect.any(Error));
    expect(debugHook.onSubscribe).toHaveBeenCalledWith(subscriber);
    expect(debugHook.onUnsubscribe).toHaveBeenCalledWith(subscriber);
    expect(debugHook.onUnlisten).toHaveBeenCalledWith('destroy');
  });
});
