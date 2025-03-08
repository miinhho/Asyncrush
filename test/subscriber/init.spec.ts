import { BackpressureMode, PoolableEvent, RushSubscriber } from "../../lib";

describe('initialization', () => {
  test('should create with default options', () => {
    const subscriber = new RushSubscriber();
    expect(subscriber.isDestroyed()).toBe(false);
    expect(subscriber.stream).toBeUndefined();
  });

  test('should create with backpressure options', () => {
    const subscriber = new RushSubscriber({
      backpressure: {
        highWatermark: 10,
        lowWatermark: 5,
        mode: BackpressureMode.NOTIFY
      }
    });

    const controller = subscriber.getBackpressureController();
    expect(controller).toBeDefined();
  });

  test('should create with object pool', () => {
    const subscriber = new RushSubscriber({
      useObjectPool: true,
      poolConfig: {
        initialSize: 2,
        maxSize: 5
      }
    });

    const event = subscriber.createEvent('test', { value: 42 });
    expect(event).toBeInstanceOf(PoolableEvent);
    expect(event.type).toBe('test');
    expect(event.data).toEqual({ value: 42 });

    subscriber.recycleEvent(event);
  });
});
