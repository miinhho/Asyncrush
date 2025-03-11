/**
 * Manages event listeners and their cleanup
 */
export class EventCleanupManager {
  /**
   * Maps target objects to their event listeners
   */
  private readonly listenerMap: WeakMap<
    EventTarget | object,
    Map<string, Set<{ listener: Function; options?: any }>>
  > = new WeakMap();

  /**
   * Maps listeners to their original functions
   */
  private readonly wrappedListeners: WeakMap<Function, Function> =
    new WeakMap();

  /**
   * Adds an event listener to a DOM target
   * @param target The EventTarget to attach the listener to
   * @param eventName The name of the event
   * @param listener The event handler function
   * @param options Listener options (capture, once, passive)
   * @returns Function to remove this specific listener
   */
  addDOMListener(
    target: EventTarget,
    eventName: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): () => void {
    this.storeListener(target, eventName, listener, options);
    target.addEventListener(eventName, listener, options);
    return () => {
      target.removeEventListener(eventName, listener, options);
      this.removeListenerFromStore(target, eventName, listener);
    };
  }

  /**
   * Adds an event listener to a Node.js EventEmitter
   * @param emitter The event emitter
   * @param eventName The name of the event
   * @param listener The event handler function
   * @returns Function to remove this specific listener
   */
  addEmitterListener(
    emitter: { on: Function; off: Function },
    eventName: string,
    listener: Function
  ): () => void {
    this.storeListener(emitter, eventName, listener);
    emitter.on(eventName, listener);
    return () => {
      emitter.off(eventName, listener);
      this.removeListenerFromStore(emitter, eventName, listener);
    };
  }

  /**
   * Creates a wrapped listener that can be removed later
   * @param originalListener The original listener function
   * @param wrapper Function that wraps the original listener
   * @returns Wrapped listener that maintains a reference to the original
   */
  createWrappedListener<T extends Function>(
    originalListener: T,
    wrapper: (listener: T) => Function
  ): Function {
    const wrappedListener = wrapper(originalListener);
    this.wrappedListeners.set(wrappedListener, originalListener);
    return wrappedListener;
  }

  /**
   * Stores a listener in the internal maps
   * @param target The event target or emitter
   * @param eventName The name of the event
   * @param listener The event handler function
   * @param options Optional listener options
   */
  private storeListener(
    target: EventTarget | object,
    eventName: string,
    listener: Function,
    options?: any
  ): void {
    let eventMap = this.listenerMap.get(target);
    if (!eventMap) {
      eventMap = new Map();
      this.listenerMap.set(target, eventMap);
    }

    let listeners = eventMap.get(eventName);
    if (!listeners) {
      listeners = new Set();
      eventMap.set(eventName, listeners);
    }

    listeners.add({ listener, options });
  }

  /**
   * Removes a listener from the internal store
   * @param target The event target or emitter
   * @param eventName The name of the event
   * @param listener The event handler function to remove
   */
  private removeListenerFromStore(
    target: EventTarget | object,
    eventName: string,
    listener: Function
  ): void {
    const eventMap = this.listenerMap.get(target);
    if (!eventMap) return;

    const listeners = eventMap.get(eventName);
    if (!listeners) return;

    const originalListener = this.wrappedListeners.get(listener) || listener;

    for (const entry of listeners) {
      const storedListener =
        this.wrappedListeners.get(entry.listener) || entry.listener;

      if (storedListener === originalListener) {
        listeners.delete(entry);
        if (storedListener !== entry.listener) {
          this.wrappedListeners.delete(entry.listener);
        }
        break;
      }
    }

    if (listeners.size === 0) {
      eventMap.delete(eventName);
    }
  }

  /**
   * Removes all listeners for a specific event from a target
   * @param target The event target or emitter
   * @param eventName The name of the event
   */
  removeAllListeners(
    target: EventTarget | { off?: Function; removeAllListeners?: Function },
    eventName?: string
  ): void {
    const eventMap = this.listenerMap.get(target);
    if (!eventMap) return;

    if (eventName) {
      const listeners = eventMap.get(eventName);
      if (!listeners) return;

      for (const { listener, options } of listeners) {
        if ('removeEventListener' in target) {
          (target as EventTarget).removeEventListener(
            eventName,
            listener as EventListener,
            options
          );
        } else if ('off' in target && target.off) {
          target.off(eventName, listener);
        }
      }

      eventMap.delete(eventName);
    } else {
      for (const [event, listeners] of eventMap.entries()) {
        for (const { listener, options } of listeners) {
          if ('removeEventListener' in target)
            (target as EventTarget).removeEventListener(
              event,
              listener as EventListener,
              options
            );
          else if ('off' in target && target.off) {
            target.off(event, listener);
          }
        }
      }

      if ('removeAllListeners' in target && target.removeAllListeners) {
        target.removeAllListeners();
      }

      this.listenerMap.set(target, new Map());
    }
  }

  /**
   * Checks if a target has any listeners for a specific event
   * @param target The event target or emitter
   * @param eventName Optional event name to check
   * @returns True if the target has listeners for the specified event
   */
  hasListeners(target: EventTarget | object, eventName?: string): boolean {
    const eventMap = this.listenerMap.get(target);
    if (!eventMap) return false;

    if (eventName) {
      const listeners = eventMap.get(eventName);
      return !!listeners && listeners.size > 0;
    }

    return eventMap.size > 0;
  }

  /**
   * Gets the number of listeners for a specific event
   * @param target The event target or emitter
   * @param eventName Optional event name to count
   * @returns The number of listeners
   */
  listenerCount(target: EventTarget | object, eventName?: string): number {
    const eventMap = this.listenerMap.get(target);
    if (!eventMap) return 0;

    if (eventName) {
      const listeners = eventMap.get(eventName);
      return listeners ? listeners.size : 0;
    }

    let count = 0;
    for (const listeners of eventMap.values()) {
      count += listeners.size;
    }
    return count;
  }
}

/**
 * A singleton instance of the cleanup manager
 */
export const cleanupManager = new EventCleanupManager();

/**
 * Helper function to add a DOM event listener with automatic cleanup
 */
export const addDOMListener = (
  target: EventTarget,
  eventName: string,
  listener: EventListener,
  options?: AddEventListenerOptions
): (() => void) => {
  return cleanupManager.addDOMListener(target, eventName, listener, options);
};

/**
 * Helper function to add an EventEmitter listener with automatic cleanup
 */
export const addEmitterListener = (
  emitter: { on: Function; off: Function },
  eventName: string,
  listener: Function
): (() => void) => {
  return cleanupManager.addEmitterListener(emitter, eventName, listener);
};

/**
 * Integration with the RushStream API for automatic listener cleanup
 * @param targets DOM elements or EventEmitters to watch
 * @returns Object with cleanup functions
 */
export const createEventCleanup = (
  targets: Array<EventTarget | { on: Function; off: Function }>
): {
  cleanup: () => void;
  count: () => number;
  addDOMListener: typeof addDOMListener;
  addEmitterListener: typeof addEmitterListener;
} => {
  const cleanupFunctions: Array<() => void> = [];

  const trackAddDOMListener = (
    target: EventTarget,
    eventName: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): (() => void) => {
    const cleanup = addDOMListener(target, eventName, listener, options);
    cleanupFunctions.push(cleanup);
    return () => {
      cleanup();
      const index = cleanupFunctions.indexOf(cleanup);
      if (index !== -1) {
        cleanupFunctions.splice(index, 1);
      }
    };
  };

  const trackAddEmitterListener = (
    emitter: { on: Function; off: Function },
    eventName: string,
    listener: Function
  ): (() => void) => {
    const cleanup = addEmitterListener(emitter, eventName, listener);
    cleanupFunctions.push(cleanup);
    return () => {
      cleanup();
      const index = cleanupFunctions.indexOf(cleanup);
      if (index !== -1) {
        cleanupFunctions.splice(index, 1);
      }
    };
  };

  return {
    cleanup: () => {
      while (cleanupFunctions.length > 0) {
        const cleanup = cleanupFunctions.pop();
        if (cleanup) cleanup();
      }
      targets.forEach((target) => {
        cleanupManager.removeAllListeners(target as any);
      });
    },

    count: () => {
      return targets.reduce(
        (sum, target) => sum + cleanupManager.listenerCount(target),
        0
      );
    },

    addDOMListener: trackAddDOMListener,
    addEmitterListener: trackAddEmitterListener,
  };
};
