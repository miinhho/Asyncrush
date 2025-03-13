import { RushObserver, RushStream, RushSubscriber } from '../../lib';

describe('multicasting', () => {
  it('should not resubscribe an already subscribed subscriber', () => {
    const stream = new RushStream<string>(() => {});
    const sub = new RushSubscriber<string>();

    stream.subscribe(sub);
    expect(stream.subscribers.size).toBe(1);

    stream.subscribe(sub);
    expect(stream.subscribers.size).toBe(1);
  });

  it('should not unsubscribe a non-subscribed subscriber', () => {
    const stream = new RushStream<string>(() => {});
    const sub = new RushSubscriber<string>();
    const otherSub = new RushSubscriber<string>();

    stream.subscribe(sub);
    expect(stream.subscribers.size).toBe(1);

    stream.unsubscribe(otherSub);
    expect(stream.subscribers.size).toBe(1);
  });

  it('should broadcast events to subscribers', async () => {
    const sub1NextSpy = jest.fn();
    const sub2NextSpy = jest.fn();

    const sub1 = new RushSubscriber<string>();
    sub1.use(sub1NextSpy);

    const sub2 = new RushSubscriber<string>();
    sub2.use(sub2NextSpy);

    const stream = new RushStream<string>((observer) => {
      observer.next('event1');
    });

    stream.subscribe(sub1, sub2).listen({
      next: () => { }
    });

    expect(sub1NextSpy).toHaveBeenCalledWith('event1');
    expect(sub2NextSpy).toHaveBeenCalledWith('event1');
  });

  it('should manage subscriber lifecycle', async () => {
    const stream = new RushStream<string>((observer) => {
      observer.next('hello');
    });
    const sub1 = new RushSubscriber<string>();
    const sub2 = new RushSubscriber<string>();

    expect(stream.subscribers.size).toBe(0);

    stream.subscribe(sub1, sub2);
    expect(stream.subscribers.size).toBe(2);
    expect(sub1.stream).toBe(stream);

    stream.unsubscribe(sub1);
    expect(stream.subscribers.size).toBe(1);
    expect(sub1.stream).toBeUndefined();
    expect(sub2.stream).toBe(stream);

    stream.unsubscribe(sub2);
    expect(stream.subscribers.size).toBe(0);
  });

  it('should complete subscribers on stream completion', async () => {
    const sub1CompleteSpy = jest.fn();
    const sub2CompleteSpy = jest.fn();
    const completeSpy = jest.fn();

    const sub1 = new RushSubscriber<string>();
    sub1.onComplete(sub1CompleteSpy);

    const sub2 = new RushSubscriber<string>();
    sub2.onComplete(sub2CompleteSpy);

    const stream = new RushStream<string>((observer) => {
      observer.complete();
    });

    stream.subscribe(sub1, sub2);

    stream.listen({
      complete: completeSpy
    });

    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(sub1CompleteSpy).toHaveBeenCalledTimes(1);
    expect(sub2CompleteSpy).toHaveBeenCalledTimes(1);
  });

  it('should propagate errors to all subscribers', () => {
    const sub1ErrorSpy = jest.fn();
    const sub2ErrorSpy = jest.fn();
    const streamErrorSpy = jest.fn();
    const testError = new Error('Test error');

    const sub1 = new RushSubscriber<string>();
    sub1.onError(sub1ErrorSpy);

    const sub2 = new RushSubscriber<string>();
    sub2.onError(sub2ErrorSpy);

    let sourceObserver: RushObserver<string>;
    const stream = new RushStream<string>((observer) => {
      sourceObserver = observer;
    });

    stream.subscribe(sub1, sub2);

    stream.listen({
      error: streamErrorSpy
    });

    sourceObserver!.error(testError);
    expect(streamErrorSpy).toHaveBeenCalledWith(testError);

    expect(sub1ErrorSpy).not.toHaveBeenCalledWith(testError);
    expect(sub2ErrorSpy).not.toHaveBeenCalledWith(testError);
  });
});
