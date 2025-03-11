import { createStream, RushStream, withDelay } from '../../lib';

jest.mock('../../lib/utils/create-stream', () => ({
  createStream: jest.fn()
}));

jest.useFakeTimers();

describe('withDelay', () => {
  let mockSource: RushStream<string>;
  let mockObserver: any;
  let mockUnlisten: jest.Mock;
  let sourceNextCallback: (value: string) => void;
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
    } as unknown as RushStream<string>;

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

  test('should delay emitting values by the specified time', () => {
    withDelay(mockSource, 10);
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    sourceNextCallback('test value');
    expect(mockObserver.next).not.toHaveBeenCalled();

    jest.advanceTimersByTime(9);
    expect(mockObserver.next).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockObserver.next).toHaveBeenCalledWith('test value');
  });

  test('should delay completion by the specified time', () => {
    withDelay(mockSource, 10);
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    sourceCompleteCallback();
    expect(mockObserver.complete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(9);
    expect(mockObserver.complete).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockObserver.complete).toHaveBeenCalled();
  });

  test('should propagate errors immediately without delay', () => {
    withDelay(mockSource, 10);
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    factory(mockObserver);

    const error = new Error('Test error');
    sourceErrorCallback(error);

    expect(mockObserver.error).toHaveBeenCalledWith(error);
  });

  test('should clean up subscription on unsubscribe', () => {
    withDelay(mockSource, 10);
    const factory = (createStream as jest.Mock).mock.calls[0][0];
    const cleanup = factory(mockObserver);

    cleanup();

    expect(mockUnlisten).toHaveBeenCalled();
  });

  test('should pass options to the createStream function', () => {
    const options = {
      continueOnError: true,
    };
    withDelay(mockSource, 10, options);

    expect(createStream).toHaveBeenCalledWith(expect.any(Function), options);
  });

  test('should use empty options object if none provided', () => {
    withDelay(mockSource, 10);

    expect(createStream).toHaveBeenCalledWith(expect.any(Function), {});
  });
});
