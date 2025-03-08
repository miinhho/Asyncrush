import { addDOMListener, addEmitterListener, createEventCleanup } from '../../lib';
import { MockEventEmitter, MockEventTarget } from '../mock-object';

describe('Helper functions', () => {
  let target: MockEventTarget;
  let emitter: MockEventEmitter;

  beforeEach(() => {
    target = new MockEventTarget();
    emitter = new MockEventEmitter();
  });

  test('addDOMListener should use the singleton manager', () => {
    const listener = jest.fn();

    const cleanup = addDOMListener(
      target as unknown as EventTarget,
      'click',
      listener
    );

    expect(target.getListenerCount('click')).toBe(1);

    cleanup();
    expect(target.getListenerCount('click')).toBe(0);
  });

  test('addEmitterListener should use the singleton manager', () => {
    const listener = jest.fn();

    const cleanup = addEmitterListener(
      emitter,
      'data',
      listener
    );

    expect(emitter.getListenerCount('data')).toBe(1);

    cleanup();
    expect(emitter.getListenerCount('data')).toBe(0);
  });

  test('createEventCleanup should track and cleanup multiple targets', () => {
    const target2 = new MockEventTarget();
    const emitter2 = new MockEventEmitter();

    const eventCleanup = createEventCleanup([
      target as unknown as EventTarget,
      emitter,
      target2 as unknown as EventTarget,
      emitter2
    ]);

    const clickListener = jest.fn();
    const dataListener = jest.fn();

    eventCleanup.addDOMListener(
      target as unknown as EventTarget,
      'click',
      clickListener
    );

    eventCleanup.addDOMListener(
      target2 as unknown as EventTarget,
      'mouseover',
      jest.fn()
    );

    eventCleanup.addEmitterListener(
      emitter,
      'data',
      dataListener
    );

    eventCleanup.addEmitterListener(
      emitter2,
      'event',
      jest.fn()
    );

    expect(eventCleanup.count()).toBe(4);

    const mousedownCleanup = eventCleanup.addDOMListener(
      target as unknown as EventTarget,
      'mousedown',
      jest.fn()
    );

    expect(eventCleanup.count()).toBe(5);

    mousedownCleanup();
    expect(eventCleanup.count()).toBe(4);

    eventCleanup.cleanup();

    expect(target.getListenerCount()).toBe(0);
    expect(target2.getListenerCount()).toBe(0);
    expect(emitter.getListenerCount()).toBe(0);
    expect(emitter2.getListenerCount()).toBe(0);
    expect(eventCleanup.count()).toBe(0);
  });
});
