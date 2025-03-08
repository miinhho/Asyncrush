import { EventCleanupManager } from '../../lib';
import { MockEventTarget } from '../mock-object';

describe('Wrapped listeners', () => {
  let manager: EventCleanupManager;
  let target: MockEventTarget;

  beforeEach(() => {
    manager = new EventCleanupManager();
    target = new MockEventTarget();
  });

  test('should handle wrapped listeners', () => {
    const originalListener = jest.fn();

    const wrappedListener = manager.createWrappedListener(
      originalListener,
      (fn) => (event: any) => {
        const enhancedEvent = { ...event, enhanced: true };
        fn(enhancedEvent);
      }
    );

    manager.addDOMListener(
      target as unknown as EventTarget,
      'click',
      wrappedListener as unknown as EventListener
    );

    target.dispatchEvent({ type: 'click' });
    expect(originalListener).toHaveBeenCalledWith(expect.objectContaining({
      type: 'click',
      enhanced: true
    }));

    manager.removeAllListeners(target as unknown as EventTarget, 'click');
    expect(target.getListenerCount('click')).toBe(0);
  });
});
