import { EventCleanupManager } from '../../lib';
import { MockEventEmitter, MockEventTarget } from '../mock-object';

describe('removeAllListeners', () => {
  let manager: EventCleanupManager;
  let target: MockEventTarget;
  let emitter: MockEventEmitter;

  beforeEach(() => {
    manager = new EventCleanupManager();
    target = new MockEventTarget();
    emitter = new MockEventEmitter();
  });

  test('should remove all listeners for a specific event', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const listener3 = jest.fn();

    manager.addDOMListener(target as unknown as EventTarget, 'click', listener1);
    manager.addDOMListener(target as unknown as EventTarget, 'click', listener2);
    manager.addDOMListener(target as unknown as EventTarget, 'mouseover', listener3);

    expect(target.getListenerCount()).toBe(3);

    manager.removeAllListeners(target as unknown as EventTarget, 'click');

    expect(target.getListenerCount('click')).toBe(0);
    expect(target.getListenerCount('mouseover')).toBe(1);
  });

  test('should remove all listeners for all events', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    manager.addDOMListener(target as unknown as EventTarget, 'click', listener1);
    manager.addDOMListener(target as unknown as EventTarget, 'mouseover', listener2);
    manager.addEmitterListener(emitter, 'data', listener1);

    expect(target.getListenerCount()).toBe(2);
    expect(emitter.getListenerCount()).toBe(1);

    manager.removeAllListeners(target as unknown as EventTarget);
    manager.removeAllListeners(emitter as any);

    expect(target.getListenerCount()).toBe(0);
    expect(emitter.getListenerCount()).toBe(0);
  });
});
