import { createStream, fromDOMEvent } from '../../lib';

jest.mock('../../lib/utils/create-stream');

describe('fromDOMEvent', () => {
  let mockTarget;
  let mockCreateStream;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTarget = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
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

  it('should create a stream from DOM events', () => {
    const eventName = 'click';
    const options = { capture: true, passive: true };

    fromDOMEvent(mockTarget, eventName, options);
    const { observer, cleanup } = mockCreateStream.mock.results[0].value;

    expect(createStream).toHaveBeenCalled();
    expect(mockTarget.addEventListener).toHaveBeenCalledWith(
      eventName,
      expect.any(Function),
      expect.objectContaining({ capture: true, passive: true })
    );

    const mockEvent = { type: 'click' };
    const eventHandler = mockTarget.addEventListener.mock.calls[0][1];
    eventHandler(mockEvent);
    expect(observer.next).toHaveBeenCalledWith(mockEvent);

    cleanup();
    expect(mockTarget.removeEventListener).toHaveBeenCalledWith(
      eventName,
      eventHandler,
      expect.objectContaining({ capture: true, passive: true })
    );
  });

  it('should handle multiple targets', () => {
    const mockTarget2 = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    const targets = [mockTarget, mockTarget2];
    const eventName = 'click';

    fromDOMEvent(targets, eventName);
    const { cleanup } = mockCreateStream.mock.results[0].value;

    expect(mockTarget.addEventListener).toHaveBeenCalledWith(
      eventName,
      expect.any(Function),
      expect.any(Object)
    );
    expect(mockTarget2.addEventListener).toHaveBeenCalledWith(
      eventName,
      expect.any(Function),
      expect.any(Object)
    );

    cleanup();
    expect(mockTarget.removeEventListener).toHaveBeenCalled();
    expect(mockTarget2.removeEventListener).toHaveBeenCalled();
  });

  it('should include targets in eventTargets option', () => {
    const eventName = 'click';
    const existingTarget = new EventTarget();
    const options = { eventTargets: [existingTarget] };

    fromDOMEvent(mockTarget, eventName, options);

    expect(mockCreateStream).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        eventTargets: [existingTarget, mockTarget]
      })
    );
  });

  it('should pass correct listener options', () => {
    const eventName = 'click';
    const listenerOptions = {
      passive: true,
      capture: true,
      once: true,
      signal: new AbortController().signal
    };

    fromDOMEvent(mockTarget, eventName, listenerOptions);

    expect(mockTarget.addEventListener).toHaveBeenCalledWith(
      eventName,
      expect.any(Function),
      expect.objectContaining(listenerOptions)
    );
  });
});
