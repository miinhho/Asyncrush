import { RushStream } from "../../lib";
import { MockEventTarget } from "../mock-object";

describe('event targets', () => {
  test('should manage DOM event listeners', () => {
    const target = new MockEventTarget();

    const stream = new RushStream(() => {}, {
      eventTargets: [target as unknown as EventTarget]
    });

    const listener = jest.fn();
    const cleanup = stream.addDOMListener(
      target as unknown as EventTarget,
      'click',
      listener as unknown as EventListener
    );

    expect(target.getListenerCount()).toBe(1);

    cleanup();
    expect(target.getListenerCount()).toBe(0);

    stream.addDOMListener(
      target as unknown as EventTarget,
      'mouseover',
      jest.fn() as unknown as EventListener
    );

    expect(target.getListenerCount()).toBe(1);

    stream.unlisten();
    expect(target.getListenerCount()).toBe(0);
  });

  test('should throw when event cleanup not enabled', () => {
    const stream = new RushStream(() => {});

    expect(() => {
      stream.addDOMListener({} as EventTarget, 'click', jest.fn() as EventListener);
    }).toThrow('Event cleanup is not enabled');

    expect(() => {
      stream.addEmitterListener({} as any, 'data', jest.fn());
    }).toThrow('Event cleanup is not enabled');
  });
});
