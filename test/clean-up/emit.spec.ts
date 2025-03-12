import { EventCleanupManager } from '../../lib';
import { MockEventEmitter } from '../mock';

describe('EventEmitter listeners', () => {
  let manager: EventCleanupManager;
  let emitter: MockEventEmitter;

  beforeEach(() => {
    manager = new EventCleanupManager();
    emitter = new MockEventEmitter();
  });

  test('should add and remove EventEmitter listeners', () => {
    const listener = jest.fn();

    const cleanup = manager.addEmitterListener(
      emitter,
      'data',
      listener
    );

    expect(emitter.getListenerCount('data')).toBe(1);

    emitter.emit('data', 'test-data');
    expect(listener).toHaveBeenCalledWith('test-data');

    cleanup();
    expect(emitter.getListenerCount('data')).toBe(0);

    emitter.emit('data', 'more-data');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
