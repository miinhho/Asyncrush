import { ObjectPool } from '../../lib';

describe('pool management', () => {
  test('should clear all pooled objects', () => {
    const factory = jest.fn(() => ({}));
    const pool = new ObjectPool(factory, { initialSize: 5 });

    expect(pool.size).toBe(5);

    pool.clear();
    expect(pool.size).toBe(0);
  });
});
