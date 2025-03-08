import { PoolableEvent, RushObserver, RushStream } from "../../lib";

describe('event pooling', () => {
  test('should pool event objects', () => {
    const stream = new RushStream(() => {}, {
      useObjectPool: true,
      poolConfig: {
        initialSize: 2,
        maxSize: 5
      }
    });

    const event1 = stream.createEvent('test', { value: 1 });
    expect(event1).toBeInstanceOf(PoolableEvent);
    expect(event1.type).toBe('test');
    expect(event1.data).toEqual({ value: 1 });

    stream.recycleEvent(event1);
    const event2 = stream.createEvent('test2', { value: 2 });

    expect(event2).toBeInstanceOf(PoolableEvent);
    expect(event2.type).toBe('test2');
    expect(event2.data).toEqual({ value: 2 });
  });

  test('should throw error when pool not enabled', () => {
    const stream = new RushStream(() => {});

    expect(() => {
      stream.createEvent('test');
    }).toThrow('Object pooling is not enabled');

    expect(() => {
      stream.recycleEvent({} as PoolableEvent);
    }).toThrow('Object pooling is not enabled');
  });

  test('should process poolable events', () => {
    const nextSpy = jest.fn();
    let sourceObserver: RushObserver<any>;

    const stream = new RushStream((observer) => {
      sourceObserver = observer;
    }, {
      useObjectPool: true
    });

    stream.listen({
      next: nextSpy
    });

    const event = stream.createEvent('test-event', { value: 42 });
    sourceObserver!.next(event);

    expect(nextSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'test-event',
      data: { value: 42 }
    }));
  });
});
