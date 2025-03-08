import { ObjectPool } from '../../lib';

describe('acquire and release', () => {
  test('should create new objects when pool is empty', () => {
    const factory = jest.fn().mockImplementation(() => ({ id: factory.mock.calls.length }));
    const pool = new ObjectPool(factory);

    const obj1 = pool.acquire();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(obj1).toEqual({ id: 1 });

    const obj2 = pool.acquire();
    expect(factory).toHaveBeenCalledTimes(2);
    expect(obj2).toEqual({ id: 2 });
  });

  test('should reuse objects from the pool', () => {
    const factory = jest.fn().mockImplementation(() => ({ id: factory.mock.calls.length }));
    const pool = new ObjectPool(factory);

    const obj1 = pool.acquire();
    pool.release(obj1);

    const obj2 = pool.acquire();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(obj2).toBe(obj1);
  });

  test('should reset objects before reuse', () => {
    const reset = jest.fn((obj) => {
      obj.value = 0;
      obj.flag = false;
    });

    const factory = jest.fn(() => ({ value: 0, flag: false }));
    const pool = new ObjectPool(factory, { reset });

    const obj = pool.acquire();
    obj.value = 42;
    obj.flag = true;

    pool.release(obj);
    expect(reset).toHaveBeenCalledWith(obj);

    const reusedObj = pool.acquire();
    expect(reusedObj.value).toBe(0);
    expect(reusedObj.flag).toBe(false);
  });
});
