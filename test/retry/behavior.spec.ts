import { createRetryWrapper } from '../../lib/core/retry';

jest.useFakeTimers();

describe('retry behavior', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should retry failed middleware execution', async () => {
    let attempts = 0;
    const testError = new Error('Temporary error');

    const middleware = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts <= 2) {
        throw testError;
      }
      return 'success';
    });

    const errorHandler = jest.fn();
    const { applyMiddleware } = createRetryWrapper(
      [middleware],
      {
        retries: 3,
        retryDelay: 10
      },
      errorHandler
    );

    const resultPromise = applyMiddleware('test');
    expect(resultPromise).toBeInstanceOf(Promise);

    expect(middleware).toHaveBeenCalledTimes(1);
    expect(errorHandler).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10);

    expect(middleware).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(20);

    const result = await resultPromise;
    expect(result).toBe('success');
    expect(middleware).toHaveBeenCalledTimes(3);
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('should give up after max retries and call error handler', async () => {
    const testError = new Error('Persistent error');
    const middleware = jest.fn().mockImplementation(() => {
      throw testError;
    });

    const errorHandler = jest.fn();
    const { applyMiddleware } = createRetryWrapper(
      [middleware],
      {
        retries: 2,
        retryDelay: 1,
        delayFn: (attempt, baseDelay) => baseDelay
      },
      errorHandler
    );

    const resultPromise = applyMiddleware('test');
    expect(middleware).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    expect(middleware).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(1);
    expect(middleware).toHaveBeenCalledTimes(3);

    await expect(resultPromise).rejects.toThrow(testError);
    expect(errorHandler).toHaveBeenCalledWith(testError);
  });

  it('should apply exponential backoff with jitter', async () => {
    let lastDelay = 0;
    const now = jest.fn().mockImplementation(() => lastDelay);
    jest.spyOn(global.Date, 'now').mockImplementation(now);

    let attempts = 0;
    const middleware = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts <= 3) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return 'success';
    });

    const { applyMiddleware } = createRetryWrapper(
      [middleware],
      {
        retries: 3,
        retryDelay: 10,
        jitter: 0.5,
        delayFn: (attempt, baseDelay) => baseDelay,
      },
      jest.fn()
    );

    const resultPromise = applyMiddleware('test');

    const delays: number[] = [];

    lastDelay = 0;
    jest.advanceTimersByTime(15);
    delays.push(Date.now());

    lastDelay = 15;
    jest.advanceTimersByTime(25);
    delays.push(Date.now() - delays[0]);

    lastDelay = 40;
    jest.advanceTimersByTime(50);
    delays.push(Date.now() - delays[0] - delays[1]);

    const result = await resultPromise;
    expect(result).toBe('success');

    expect(delays[1]).toBeGreaterThan(delays[0]);
    expect(delays[2]).toBeGreaterThan(delays[1]);

    jest.spyOn(global.Date, 'now').mockRestore();
  });
});
