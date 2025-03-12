import { EventCleanupManager } from '../../lib';
import { MockEventTarget } from '../mock';

describe('DOM listeners', () => {
  let manager: EventCleanupManager;
  let target: MockEventTarget;

  beforeEach(() => {
    manager = new EventCleanupManager();
    target = new MockEventTarget();
  });

  test('should add and remove DOM event listeners', () => {
    const listener = jest.fn();
    const options = { capture: true };

    const cleanup = manager.addDOMListener(
      target as unknown as EventTarget,
      'click',
      listener,
      options
    );

    expect(target.getListenerCount('click')).toBe(1);

    target.dispatchEvent({ type: 'click' });
    expect(listener).toHaveBeenCalledTimes(1);

    cleanup();
    expect(target.getListenerCount('click')).toBe(0);

    target.dispatchEvent({ type: 'click' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('should track listeners correctly', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    manager.addDOMListener(target as unknown as EventTarget, 'click', listener1);
    manager.addDOMListener(target as unknown as EventTarget, 'mouseover', listener2);

    expect(manager.hasListeners(target)).toBe(true);
    expect(manager.hasListeners(target, 'click')).toBe(true);
    expect(manager.hasListeners(target, 'keypress')).toBe(false);

    expect(manager.listenerCount(target)).toBe(2);
    expect(manager.listenerCount(target, 'click')).toBe(1);
  });
});
