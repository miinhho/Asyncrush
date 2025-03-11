import { createStream, RushStream, withInterval } from '../../lib';

jest.mock('../../lib/utils/create-stream', () => ({
  createStream: jest.fn()
}));

jest.useFakeTimers();

describe('withInterval', () => {
  let mockObserver: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    mockObserver = {
      next: jest.fn(),
      error: jest.fn(),
      complete: jest.fn()
    };

    (createStream as jest.Mock).mockImplementation((factory, options) => {
      const cleanup = factory(mockObserver);
      return new RushStream(cleanup, options);
    });
  });

  test('should emit a static value at the specified interval', () => {
    const intervalMs = 10;
    const staticValue = 'test value';

    withInterval(intervalMs, staticValue);
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    expect(mockObserver.next).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10);
    expect(mockObserver.next).toHaveBeenCalledWith(staticValue);
  });

  test('should use a generator function to create dynamic values', () => {
    const intervalMs = 1;
    const generator = (count: number) => `value-${count}`;

    withInterval(intervalMs, generator);
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    jest.advanceTimersByTime(intervalMs);
    expect(mockObserver.next).toHaveBeenCalledWith('value-0');

    jest.advanceTimersByTime(intervalMs);
    expect(mockObserver.next).toHaveBeenCalledWith('value-1');

    jest.advanceTimersByTime(intervalMs);
    expect(mockObserver.next).toHaveBeenCalledWith('value-2');
  });

  test('should complete after specified count of emissions', () => {
    const intervalMs = 1;
    const value = 'test';
    const count = 3;

    withInterval(intervalMs, value, { count });
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    jest.advanceTimersByTime(intervalMs * count);
    expect(mockObserver.complete).toHaveBeenCalled();
  });

  test('should handle errors in generator function', () => {
    const intervalMs = 1;
    const errorMessage = 'Generator error';
    const generator = (count: number) => {
      if (count === 2) {
        throw new Error(errorMessage);
      }
      return `value-${count}`;
    };

    withInterval(intervalMs, generator);
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    jest.advanceTimersByTime(intervalMs * 2);
    expect(mockObserver.next).toHaveBeenCalledWith('value-0');
    expect(mockObserver.next).toHaveBeenCalledWith('value-1');

    jest.advanceTimersByTime(intervalMs);
    expect(mockObserver.error).toHaveBeenCalledWith(expect.any(Error));
  });

  test('should pass stream options to createStream', () => {
    const options = {
      continueOnError: true,
    };
    withInterval(10, 'test', options);

    expect(createStream).toHaveBeenCalledWith(expect.any(Function), options);
  });

  test('should exclude count from options passed to createStream', () => {
    const options = {
      name: 'countLimitedInterval',
      debugEnabled: true,
      count: 5
    };

    const { count, ...expectedOptions } = options;
    withInterval(10, 'test', options);

    expect(createStream).toHaveBeenCalledWith(expect.any(Function), expectedOptions);
  });
});
