import { createRetryWrapper } from '../../lib/core/retry';

describe('synchronous middleware', () => {
  test('should apply middleware chain to value', async () => {
    const middlewares = [
      (val: number) => val + 1,
      (val: number) => val * 2,
      (val: number) => val - 3
    ];

    const errorHandler = jest.fn();
    const { applyMiddleware } = createRetryWrapper(middlewares, {}, errorHandler);

    const result = applyMiddleware(5);
    expect(result).toBe(9);
  });

  test('should handle empty middleware chain', async () => {
    const { applyMiddleware } = createRetryWrapper([], {}, jest.fn());

    const result = applyMiddleware('test');
    expect(result).toBe('test');
  });

  test('should call error handler on middleware failure', async () => {
    const testError = new Error('Middleware error');
    const middlewares = [
      () => { throw testError; }
    ];

    const errorHandler = jest.fn();
    const { applyMiddleware } = createRetryWrapper(middlewares, {}, errorHandler);

    expect(() => applyMiddleware('test' as never)).toThrow(testError);
    expect(errorHandler).toHaveBeenCalledWith(testError);
  });
});
