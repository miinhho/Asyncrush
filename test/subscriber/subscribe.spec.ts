import { RushStream, RushSubscriber } from "../../lib";

describe('stream subscription', () => {
  test('should subscribe to stream', () => {
    const stream = new RushStream<string>(() => {});
    const subscriber = new RushSubscriber<string>();

    subscriber.subscribe(stream);

    expect(subscriber.stream).toBe(stream);
    expect(stream.subscribers.has(subscriber)).toBe(true);
  });

  test('should unsubscribe from previous stream when subscribing to new one', () => {
    const stream1 = new RushStream<string>(() => {});
    const stream2 = new RushStream<string>(() => {});
    const subscriber = new RushSubscriber<string>();

    subscriber.subscribe(stream1);
    expect(stream1.subscribers.has(subscriber)).toBe(true);

    subscriber.subscribe(stream2);
    expect(stream1.subscribers.has(subscriber)).toBe(false);
    expect(stream2.subscribers.has(subscriber)).toBe(true);
  });

  test('should unsubscribe from stream', () => {
    const stream = new RushStream<string>(() => {});
    const subscriber = new RushSubscriber<string>();

    subscriber.subscribe(stream);
    subscriber.unsubscribe();

    expect(subscriber.stream).toBeUndefined();
    expect(stream.subscribers.has(subscriber)).toBe(false);
  });

  test('should not affect stream when destroyed', () => {
    const stream = new RushStream<string>(() => {});
    const subscriber = new RushSubscriber<string>();

    subscriber.subscribe(stream);
    subscriber.destroy();

    expect(subscriber.stream).toBeUndefined();
    expect(stream.subscribers.has(subscriber)).toBe(false);
  });
});
