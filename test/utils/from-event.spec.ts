import { createStream, fromEmitter } from '../../lib';

jest.mock('../../lib/utils/create-stream');

describe('fromEmitter', () => {
  let mockEmitter;
  let mockCreateStream;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEmitter = {
      on: jest.fn(),
      off: jest.fn()
    };

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

  it('should create a stream from emitter events', () => {
    const eventName = 'data';

    fromEmitter(mockEmitter, eventName);
    const { observer, cleanup } = mockCreateStream.mock.results[0].value;

    expect(createStream).toHaveBeenCalled();
    expect(mockEmitter.on).toHaveBeenCalledWith(eventName, expect.any(Function));
    expect(mockEmitter.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockEmitter.on).toHaveBeenCalledWith('end', expect.any(Function));

    const eventHandler = mockEmitter.on.mock.calls[0][1];
    eventHandler('test-data');
    expect(observer.next).toHaveBeenCalledWith('test-data');

    eventHandler('arg1', 'arg2', 'arg3');
    expect(observer.next).toHaveBeenCalledWith(['arg1', 'arg2', 'arg3']);

    cleanup();
    expect(mockEmitter.off).toHaveBeenCalledWith(eventName, eventHandler);
    expect(mockEmitter.off).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockEmitter.off).toHaveBeenCalledWith('end', expect.any(Function));
  });

  it('should handle error events and complete when continueOnError is false', () => {
    const eventName = 'data';
    const error = new Error('Test error');

    fromEmitter(mockEmitter, eventName);
    const { observer } = mockCreateStream.mock.results[0].value;

    const errorHandler = mockEmitter.on.mock.calls.find(call => call[0] === 'error')[1];

    errorHandler(error);
    expect(observer.error).toHaveBeenCalledWith(error);
    expect(observer.complete).toHaveBeenCalled();
  });

  it('should handle error events and not complete when continueOnError is true', () => {
    const eventName = 'data';
    const error = new Error('Test error');
    const options = { continueOnError: true };

    fromEmitter(mockEmitter, eventName, options);
    const { observer } = mockCreateStream.mock.results[0].value;
    const errorHandler = mockEmitter.on.mock.calls.find(call => call[0] === 'error')[1];

    errorHandler(error);
    expect(observer.error).toHaveBeenCalledWith(error);
    expect(observer.complete).not.toHaveBeenCalled();
  });

  it('should handle end events', () => {
    const eventName = 'data';

    fromEmitter(mockEmitter, eventName);
    const { observer } = mockCreateStream.mock.results[0].value;
    const endHandler = mockEmitter.on.mock.calls.find(call => call[0] === 'end')[1];

    endHandler();
    expect(observer.complete).toHaveBeenCalled();
  });

  it('should include emitter in eventTargets option', () => {
    const eventName = 'data';
    const existingTarget = new EventTarget();
    const options = { eventTargets: [existingTarget] };

    fromEmitter(mockEmitter, eventName, options);

    expect(mockCreateStream).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        eventTargets: [existingTarget, mockEmitter]
      })
    );
  });
});
