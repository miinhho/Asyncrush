import { createStream, fromValues } from '../../lib';

jest.mock('../../lib/utils/create-stream');

jest.useFakeTimers();

describe('fromValues', () => {
  let mockCreateStream;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    mockCreateStream = createStream as jest.Mock;
    mockCreateStream.mockImplementation((factory, options) => {
      const observer = { next: jest.fn(), error: jest.fn(), complete: jest.fn() };
      const cleanup = factory(observer);
      return {
        observer,
        cleanup,
        options,
      };
    });
  });

  test('should emit values immediately when no interval is specified', () => {
    const values = [1, 2, 3];

    fromValues(values);
    const { observer } = mockCreateStream.mock.results[0].value;

    expect(createStream).toHaveBeenCalled();
    expect(observer.next).toHaveBeenCalledTimes(3);
    expect(observer.next).toHaveBeenNthCalledWith(1, 1);
    expect(observer.next).toHaveBeenNthCalledWith(2, 2);
    expect(observer.next).toHaveBeenNthCalledWith(3, 3);
    expect(observer.complete).toHaveBeenCalled();
  });

  test('should emit values at specified interval', () => {
    const values = [1, 2, 3];
    const interval = 1;

    fromValues(values, { interval });
    const { observer, cleanup } = mockCreateStream.mock.results[0].value;

    expect(createStream).toHaveBeenCalled();
    expect(observer.next).not.toHaveBeenCalled();

    jest.advanceTimersByTime(interval);
    expect(observer.next).toHaveBeenCalledTimes(1);
    expect(observer.next).toHaveBeenCalledWith(1);

    jest.advanceTimersByTime(interval);
    expect(observer.next).toHaveBeenCalledTimes(2);
    expect(observer.next).toHaveBeenCalledWith(2);

    jest.advanceTimersByTime(interval);
    expect(observer.next).toHaveBeenCalledTimes(3);
    expect(observer.next).toHaveBeenCalledWith(3);

    jest.advanceTimersByTime(interval);
    expect(observer.complete).toHaveBeenCalled();

    cleanup();
    jest.advanceTimersByTime(interval * 10);
    expect(observer.next).toHaveBeenCalledTimes(3);
  });

  test('should complete immediately for empty array', () => {
    const values: number[] = [];

    fromValues(values);
    const { observer } = mockCreateStream.mock.results[0].value;

    expect(createStream).toHaveBeenCalled();
    expect(observer.next).not.toHaveBeenCalled();
    expect(observer.complete).toHaveBeenCalled();
  });

  test('should pass options to createStream', () => {
    const values = [1, 2, 3];
    const options = {
      continueOnError: true,
    };

    fromValues(values, options);

    expect(createStream).toHaveBeenCalledWith(
      expect.any(Function),
      options
    );
  });

  test('should ignore zero interval', () => {
    const valuesZero = [1, 2, 3];
    fromValues(valuesZero, { interval: 0 });
    const observerZero = mockCreateStream.mock.results[0].value.observer;

    expect(observerZero.next).toHaveBeenCalledTimes(3);
    expect(observerZero.complete).toHaveBeenCalled();
  });

  test('should ignore negative interval', () => {
    const valuesNegative = [1, 2, 3];

    fromValues(valuesNegative, { interval: -100 });
    const observerNegative = mockCreateStream.mock.results[0].value.observer;

    expect(observerNegative.next).toHaveBeenCalledTimes(3);
    expect(observerNegative.complete).toHaveBeenCalled();
  });
});
