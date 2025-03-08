import { createRetryWrapper } from '../../lib/core/retry';

jest.useFakeTimers();

describe('asynchronous middleware', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test('should handle promises in middleware chain', async () => {
    const middlewares = [
      async (val: number) => Promise.resolve(val + 1),
      async (val: number) => await val * 2,
      async (val: number) => Promise.resolve(val - 3),
    ];

    const { applyMiddleware } = createRetryWrapper(middlewares, {}, () => {});

    const result = await applyMiddleware(5);

    jest.advanceTimersByTime(5);
    expect(result).toBe(9);
  });

  test('should handle promise rejections in middleware', async () => {
    const testError = new Error('Async middleware error');
    const middlewares = [
      () => Promise.reject(testError)
    ];

    const errorHandler = jest.fn();
    const { applyMiddleware } = createRetryWrapper(middlewares, {}, errorHandler);

    await applyMiddleware('test' as never);

    jest.advanceTimersByTime(5);
    expect(errorHandler).toHaveBeenCalledWith(testError);
  });
});
