"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupManager = exports.EventCleanupManager = void 0;
exports.addDOMListener = addDOMListener;
exports.addEmitterListener = addEmitterListener;
exports.createEventCleanup = createEventCleanup;
/**
 * Manages event listeners and their cleanup using WeakMap to prevent memory leaks
 */
class EventCleanupManager {
    constructor() {
        /**
         * Maps target objects to their event listeners
         * Using WeakMap to automatically remove entries when targets are garbage collected
         */
        this.listenerMap = new WeakMap();
        /**
         * Maps listeners to their original functions (for wrapped listeners)
         * This helps match listeners during removal even if they were wrapped
         */
        this.wrappedListeners = new WeakMap();
    }
    /**
     * Adds an event listener to a DOM target
     * @param target The EventTarget to attach the listener to
     * @param eventName The name of the event
     * @param listener The event handler function
     * @param options Listener options (capture, once, passive)
     * @returns Function to remove this specific listener
     */
    addDOMListener(target, eventName, listener, options) {
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
    addEmitterListener(emitter, eventName, listener) {
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
    createWrappedListener(originalListener, wrapper) {
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
    storeListener(target, eventName, listener, options) {
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
    removeListenerFromStore(target, eventName, listener) {
        const eventMap = this.listenerMap.get(target);
        if (!eventMap)
            return;
        const listeners = eventMap.get(eventName);
        if (!listeners)
            return;
        const originalListener = this.wrappedListeners.get(listener) || listener;
        for (const entry of listeners) {
            const storedListener = this.wrappedListeners.get(entry.listener) || entry.listener;
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
    removeAllListeners(target, eventName) {
        const eventMap = this.listenerMap.get(target);
        if (!eventMap)
            return;
        if (eventName) {
            const listeners = eventMap.get(eventName);
            if (!listeners)
                return;
            for (const { listener, options } of listeners) {
                if ('removeEventListener' in target) {
                    target.removeEventListener(eventName, listener, options);
                }
                else if ('off' in target && target.off) {
                    target.off(eventName, listener);
                }
            }
            eventMap.delete(eventName);
        }
        else {
            for (const [event, listeners] of eventMap.entries()) {
                for (const { listener, options } of listeners) {
                    if ('removeEventListener' in target)
                        target.removeEventListener(event, listener, options);
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
    hasListeners(target, eventName) {
        const eventMap = this.listenerMap.get(target);
        if (!eventMap)
            return false;
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
    listenerCount(target, eventName) {
        const eventMap = this.listenerMap.get(target);
        if (!eventMap)
            return 0;
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
exports.EventCleanupManager = EventCleanupManager;
/**
 * A singleton instance of the cleanup manager
 */
exports.cleanupManager = new EventCleanupManager();
/**
 * Helper function to add a DOM event listener with automatic cleanup
 */
function addDOMListener(target, eventName, listener, options) {
    return exports.cleanupManager.addDOMListener(target, eventName, listener, options);
}
/**
 * Helper function to add an EventEmitter listener with automatic cleanup
 */
function addEmitterListener(emitter, eventName, listener) {
    return exports.cleanupManager.addEmitterListener(emitter, eventName, listener);
}
/**
 * Integration with the RushStream API for automatic listener cleanup
 * @param targets DOM elements or EventEmitters to watch
 * @returns Object with cleanup functions
 */
function createEventCleanup(targets) {
    const cleanupFunctions = [];
    const trackAddDOMListener = (target, eventName, listener, options) => {
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
    const trackAddEmitterListener = (emitter, eventName, listener) => {
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
                if (cleanup)
                    cleanup();
            }
            targets.forEach((target) => {
                exports.cleanupManager.removeAllListeners(target);
            });
        },
        count: () => {
            return targets.reduce((sum, target) => sum + exports.cleanupManager.listenerCount(target), 0);
        },
        addDOMListener: trackAddDOMListener,
        addEmitterListener: trackAddEmitterListener,
    };
}
