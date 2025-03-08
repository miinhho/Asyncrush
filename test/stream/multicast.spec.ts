import { RushStream, RushSubscriber } from '../../lib';

describe('multicasting', () => {
  test('should broadcast events to subscribers', async () => {
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

  test('should manage subscriber lifecycle', async () => {
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

  test('should complete subscribers on stream completion', async () => {
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
});
