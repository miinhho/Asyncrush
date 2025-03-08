import { ObjectPool } from '../../lib';

describe('initialization', () => {
  test('should create an empty pool by default', () => {
    const factory = jest.fn(() => ({}));
    const pool = new ObjectPool(factory);

    expect(pool.size).toBe(0);
    expect(factory).not.toHaveBeenCalled();
  });

  test('should pre-populate pool with initial size', () => {
    const factory = jest.fn(() => ({}));
    const pool = new ObjectPool(factory, { initialSize: 5 });

    expect(pool.size).toBe(5);
    expect(factory).toHaveBeenCalledTimes(5);
  });

  test('should respect maxSize configuration', () => {
    const factory = jest.fn(() => ({}));
    const pool = new ObjectPool(factory, { maxSize: 3 });

    const obj1 = pool.acquire();
    const obj2 = pool.acquire();
    const obj3 = pool.acquire();
    const obj4 = pool.acquire();

    pool.release(obj1);
    pool.release(obj2);
    pool.release(obj3);
    pool.release(obj4);

    expect(pool.size).toBe(3);
  });
});
