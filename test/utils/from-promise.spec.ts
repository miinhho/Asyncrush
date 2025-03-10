import { createStream, fromPromise } from '../../lib';

jest.mock('../../lib/utils/create-stream');

describe('fromPromise', () => {
  let mockCreateStream;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCreateStream = createStream as jest.Mock;
    mockCreateStream.mockImplementation((factory, options) => {
      const observer = { next: jest.fn(), error: jest.fn(), complete: jest.fn() };
      factory(observer);
      return {
        observer,
        options,
      };
    });
  });

  test('should create a stream from a resolved promise', async () => {
    const resolution = 'test-value';
    const promise = Promise.resolve(resolution);

    fromPromise(promise);
    const { observer } = mockCreateStream.mock.results[0].value;

    expect(createStream).toHaveBeenCalled();

    await promise;
    expect(observer.next).toHaveBeenCalledWith(resolution);
    expect(observer.complete).toHaveBeenCalled();
  });

  test('should create a stream from a function returning a promise', async () => {
    const resolution = 'test-value';
    const promiseFn = jest.fn().mockResolvedValue(resolution);

    fromPromise(promiseFn);
    const { observer } = mockCreateStream.mock.results[0].value;

    expect(createStream).toHaveBeenCalled();
    expect(promiseFn).toHaveBeenCalled();

    await promiseFn();
    expect(observer.next).toHaveBeenCalledWith(resolution);
    expect(observer.complete).toHaveBeenCalled();
  });

  test('should handle promise rejection', async () => {
    const error = new Error('Test error');
    const promise = Promise.reject(error);
    promise.catch(() => {});

    fromPromise(promise);
    const { observer } = mockCreateStream.mock.results[0].value;

    expect(createStream).toHaveBeenCalled();

    try {
      await promise;
    } catch {
      // ...
    }

    await Promise.resolve();
    expect(observer.error).toHaveBeenCalledWith(error);
    expect(observer.next).not.toHaveBeenCalled();
    expect(observer.complete).not.toHaveBeenCalled();
  });

  test('should pass options to createStream', () => {
    const promise = Promise.resolve('test-value');
    const options = {
      maxBufferSize: 5
    };

    fromPromise(promise, options);

    expect(createStream).toHaveBeenCalledWith(
      expect.any(Function),
      options
    );
  });
});
