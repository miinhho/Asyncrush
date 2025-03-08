import { RushObserver, RushStream, RushSubscriber } from "../../lib";

describe('debugging', () => {
  test('should call debug hooks on events', () => {
    const debugHook = {
      onEmit: jest.fn(),
      onError: jest.fn(),
      onListen: jest.fn(),
      onUnlisten: jest.fn(),
      onSubscribe: jest.fn(),
      onUnsubscribe: jest.fn()
    };

    let sourceObserver: RushObserver<string>;

    const stream = new RushStream<string>((observer) => {
      sourceObserver = observer;
    }, {
      debugHook,
      continueOnError: true
    });

    const listener = {
      next: () => {},
      error: () => {}
    };

    const sub = new RushSubscriber();

    stream.subscribe(sub);
    stream.listen(listener);

    sourceObserver!.next('test');
    sourceObserver!.error(new Error('Test error'));

    stream.unsubscribe(sub);
    stream.unlisten();

    expect(debugHook.onEmit).toHaveBeenCalledWith('test');
    expect(debugHook.onError).toHaveBeenCalledWith(expect.any(Error));
    expect(debugHook.onListen).toHaveBeenCalledWith(listener);
    expect(debugHook.onUnlisten).toHaveBeenCalled();
    expect(debugHook.onSubscribe).toHaveBeenCalledWith(sub);
    expect(debugHook.onUnsubscribe).toHaveBeenCalledWith(sub);
  });
});
