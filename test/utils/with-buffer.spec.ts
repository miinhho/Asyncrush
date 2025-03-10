import { createStream, RushStream, withBuffer } from '../../lib';

jest.mock('../../lib/utils/create-stream', () => ({
  createStream: jest.fn()
}));

jest.useFakeTimers();

describe('withBuffer', () => {
  let mockSource: RushStream<number>;
  let mockObserver: any;
  let mockUnlisten: jest.Mock;
  let sourceNextCallback: (value: number) => void;
  let sourceErrorCallback: (error: Error) => void;
  let sourceCompleteCallback: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    mockUnlisten = jest.fn();
    mockSource = {
      listen: jest.fn().mockImplementation((callbacks) => {
        sourceNextCallback = callbacks.next;
        sourceErrorCallback = callbacks.error;
        sourceCompleteCallback = callbacks.complete;
        return { unlisten: mockUnlisten };
      })
    } as unknown as RushStream<number>;

    mockObserver = {
      next: jest.fn(),
      error: jest.fn(),
      complete: jest.fn()
    };

    (createStream as jest.Mock).mockImplementation((factory, options) => {
      const cleanup = factory(mockObserver);
      return {
        listen: jest.fn(),
        cleanup,
        options
      };
    });
  });

  test('should throw error if neither count nor timeMs is specified', () => {
    expect(() => {
      withBuffer(mockSource, {});
    }).toThrow('Either count or timeMs must be specified for buffer');
  });

  test('should buffer by count and emit when buffer is full', () => {
   withBuffer(mockSource, { count: 3 });
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    sourceNextCallback(1);
    sourceNextCallback(2);
    expect(mockObserver.next).not.toHaveBeenCalled();

    sourceNextCallback(3);
    expect(mockObserver.next).toHaveBeenCalledWith([1, 2, 3]);

    sourceNextCallback(4);
    expect(mockObserver.next).toHaveBeenCalledTimes(1);
  });

  test('should buffer by time and emit after timeMs', () => {
    withBuffer(mockSource, { timeMs: 10 });
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    sourceNextCallback(1);
    sourceNextCallback(2);
    expect(mockObserver.next).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10);
    expect(mockObserver.next).toHaveBeenCalledWith([1, 2]);

    sourceNextCallback(3);
    sourceNextCallback(4);
    jest.advanceTimersByTime(10);
    expect(mockObserver.next).toHaveBeenCalledWith([3, 4]);
  });

  test('should handle both count and time triggers', () => {
    withBuffer(mockSource, { count: 3, timeMs: 10 });
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    sourceNextCallback(1);
    sourceNextCallback(2);
    expect(mockObserver.next).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10);
    expect(mockObserver.next).toHaveBeenCalledWith([1, 2]);

    sourceNextCallback(3);
    sourceNextCallback(4);
    sourceNextCallback(5);
    expect(mockObserver.next).toHaveBeenCalledWith([3, 4, 5]);
  });

  test('should flush on complete when flushOnComplete is true (default)', () => {
    withBuffer(mockSource, { count: 5 });
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    sourceNextCallback(1);
    sourceNextCallback(2);
    sourceCompleteCallback();
    expect(mockObserver.next).toHaveBeenCalledWith([1, 2]);
    expect(mockObserver.complete).toHaveBeenCalled();
  });

  test('should not flush on complete when flushOnComplete is false', () => {
    withBuffer(mockSource, { count: 5, flushOnComplete: false });
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    sourceNextCallback(1);
    sourceNextCallback(2);
    sourceCompleteCallback();
    expect(mockObserver.next).not.toHaveBeenCalled();
    expect(mockObserver.complete).toHaveBeenCalled();
  });

  test('should clear timer and propagate errors', () => {
    withBuffer(mockSource, { timeMs: 10 });
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    const error = new Error('Test error');
    sourceErrorCallback(error);

    expect(mockObserver.error).toHaveBeenCalledWith(error);
    jest.advanceTimersByTime(20);
    expect(mockObserver.next).not.toHaveBeenCalled();
  });

  test('should cleanup resources properly', () => {
    withBuffer(mockSource, { timeMs: 10 });
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    const cleanup = factory(mockObserver);

    cleanup();
    expect(mockUnlisten).toHaveBeenCalled();

    jest.advanceTimersByTime(20);
    expect(mockObserver.next).not.toHaveBeenCalled();
  });

  test('should pass stream options to createStream', () => {
    const streamOptions = { name: 'testBuffer', debugEnabled: true };
    withBuffer(mockSource, {
      count: 3,
      ...streamOptions
    });

    expect(createStream).toHaveBeenCalledWith(expect.any(Function), streamOptions);
  });
});
