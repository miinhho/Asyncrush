
export class MockEventTarget {
  private listeners: Map<string, Set<{ listener: EventListener, options?: any }>> = new Map();

  addEventListener(eventName: string, listener: EventListener, options?: any) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)?.add({ listener, options });
  }

  removeEventListener(eventName: string, listener: EventListener) {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) return;

    for (const entry of eventListeners) {
      if (entry.listener === listener) {
        eventListeners.delete(entry);
        break;
      }
    }
  }

  getListenerCount(eventName?: string): number {
    if (eventName) {
      return this.listeners.get(eventName)?.size || 0;
    }

    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.size;
    }
    return total;
  }

  dispatchEvent(event: { type: string }) {
    const eventListeners = this.listeners.get(event.type);
    if (!eventListeners) return true;

    for (const { listener } of eventListeners) {
      listener(event as any);
    }
    return true;
  }
}

export class MockEventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(eventName: string, listener: Function) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)?.add(listener);
    return this;
  }

  off(eventName: string, listener: Function) {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
    return this;
  }

  removeAllListeners(eventName?: string) {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  getListenerCount(eventName?: string): number {
    if (eventName) {
      return this.listeners.get(eventName)?.size || 0;
    }

    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.size;
    }
    return total;
  }

  emit(eventName: string, ...args: any[]) {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) return false;

    for (const listener of eventListeners) {
      listener(...args);
    }
    return true;
  }
}
