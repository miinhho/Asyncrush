import { createRetryWrapper } from '../../lib/core/retry';

describe('asynchronous middleware', () => {
  test('should properly handle resolved promises in middleware chain', async () => {
    const initialValue = 'test';
    const successfulResult = 'transformed value';

    const middlewares = [
      () => Promise.resolve(successfulResult)
    ];

    const errorHandler = jest.fn();
    const { applyMiddleware } = createRetryWrapper(middlewares, {}, errorHandler);

    const result = await applyMiddleware(initialValue);

    expect(result).toBe(successfulResult);
    expect(errorHandler).not.toHaveBeenCalled();
  });

  test('should properly handle multiple async middleware functions in chain', async () => {
    const initialValue = 5;

    const middlewares = [
      (value) => Promise.resolve(value * 2),
      (value) => Promise.resolve(value + 10),
      (value) => Promise.resolve(`Result: ${value}`)
    ];

    const errorHandler = jest.fn();
    const { applyMiddleware } = createRetryWrapper(middlewares, {}, errorHandler);

    const result = await applyMiddleware(initialValue);

    expect(result).toBe('Result: 20');
    expect(errorHandler).not.toHaveBeenCalled();
  });

  test('should handle mixed synchronous and asynchronous middleware functions', async () => {
    const initialValue = 'initial';

    const middlewares = [
      (value) => value + '-sync1',
      (value) => Promise.resolve(value + '-async1'),
      (value) => value + '-sync2',
      (value) => Promise.resolve(value + '-final')
    ];

    const errorHandler = jest.fn();
    const { applyMiddleware } = createRetryWrapper(middlewares, {}, errorHandler);

    const result = await applyMiddleware(initialValue);

    expect(result).toBe('initial-sync1-async1-sync2-final');
    expect(errorHandler).not.toHaveBeenCalled();
  });

  test('should handle promise rejection with retry mechanism', async () => {
    const asyncError = new Error('Async middleware error');
    let attemptCount = 0;

    const middlewares = [
      (value) => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.reject(asyncError);
        } else {
          return Promise.resolve(`Successfully processed ${value} after retry`);
        }
      }
    ];

    const errorHandler = jest.fn();
    const retryOptions = {
      retries: 1,
      retryDelay: 10,
      jitter: 0
    };

    const { applyMiddleware } = createRetryWrapper(middlewares, retryOptions, errorHandler);

    const result = await applyMiddleware('test');

    expect(attemptCount).toBe(2);
    expect(result).toBe('Successfully processed test after retry');
    expect(errorHandler).not.toHaveBeenCalled();
  });
});
