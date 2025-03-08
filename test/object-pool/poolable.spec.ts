import { PoolableEvent } from '../../lib';


describe('PoolableEvent', () => {
  test('should initialize with provided values', () => {
    const event = new PoolableEvent<string>();
    event.init('test-event', 'test-data', 'test-source');

    expect(event.type).toBe('test-event');
    expect(event.data).toBe('test-data');
    expect(event.source).toBe('test-source');
    expect(event.timestamp).toBeGreaterThan(0);
    expect(event.meta).toEqual({});
  });

  test('should reset all properties', () => {
    const event = new PoolableEvent();
    event.init('test-event', 'test-data', 'test-source');
    event.meta = { processed: true };

    event.reset();

    expect(event.type).toBe('');
    expect(event.data).toBeUndefined();
    expect(event.source).toBeUndefined();
    expect(event.timestamp).toBe(0);
    expect(event.meta).toBeUndefined();
  });

  test('should support method chaining for init', () => {
    const event = new PoolableEvent<number>();
    const result = event.init('count', 42, 'counter');

    expect(result).toBe(event);
  });
});
