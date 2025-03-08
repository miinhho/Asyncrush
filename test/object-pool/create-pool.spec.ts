import { PoolableEvent, createEventPool } from '../../lib';

describe('createEventPool', () => {
  test('should create a configured object pool for events', () => {
    const eventPool = createEventPool<string>(3, 10);

    expect(eventPool.size).toBe(3);

    const event = eventPool.acquire();
    expect(event).toBeInstanceOf(PoolableEvent);

    event.init('test', 'data');
    eventPool.release(event);

    const reusedEvent = eventPool.acquire();
    expect(reusedEvent.type).toBe('');
    expect(reusedEvent.data).toBeUndefined();
  });

  test('should apply reset function when releasing events', () => {
    const eventPool = createEventPool(1);

    const event = eventPool.acquire();
    event.init('test', { count: 1 });
    event.meta = { processed: true };

    eventPool.release(event);

    const reusedEvent = eventPool.acquire();
    expect(reusedEvent.type).toBe('');
    expect(reusedEvent.data).toBeUndefined();
    expect(reusedEvent.meta).toBeUndefined();
  });
});
