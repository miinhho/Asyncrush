import { PoolableEvent, RushSubscriber } from "../../lib";

describe('event pooling', () => {
  test('should pool event objects', () => {
    const subscriber = new RushSubscriber({
      useObjectPool: true,
      poolConfig: {
        initialSize: 2,
        maxSize: 5
      }
    });

    const event1 = subscriber.createEvent('test', { value: 1 });
    expect(event1).toBeInstanceOf(PoolableEvent);
    expect(event1.type).toBe('test');
    expect(event1.data).toEqual({ value: 1 });

    const event2 = subscriber.createEvent('test2', { value: 2 });

    subscriber.recycleEvent(event1);
    const event3 = subscriber.createEvent('test3', { value: 3 });

    expect(event3).not.toBe(event2);
    expect(event3.type).toBe('test3');
    expect(event3.data).toEqual({ value: 3 });
  });

  test('should throw error when pool not enabled', () => {
    const subscriber = new RushSubscriber();

    expect(() => {
      subscriber.createEvent('test');
    }).toThrow('Object pooling is not enabled');

    expect(() => {
      subscriber.recycleEvent({} as PoolableEvent);
    }).toThrow('Object pooling is not enabled');
  });
});
