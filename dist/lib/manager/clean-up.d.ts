/**
 * Manages event listeners and their cleanup
 */
export declare class EventCleanupManager {
    /**
     * Maps target objects to their event listeners
     */
    private readonly listenerMap;
    /**
     * Maps listeners to their original functions
     */
    private readonly wrappedListeners;
    /**
     * Adds an event listener to a DOM target
     * @param target The EventTarget to attach the listener to
     * @param eventName The name of the event
     * @param listener The event handler function
     * @param options Listener options (capture, once, passive)
     * @returns Function to remove this specific listener
     */
    addDOMListener(target: EventTarget, eventName: string, listener: EventListener, options?: AddEventListenerOptions): () => void;
    /**
     * Adds an event listener to a Node.js EventEmitter
     * @param emitter The event emitter
     * @param eventName The name of the event
     * @param listener The event handler function
     * @returns Function to remove this specific listener
     */
    addEmitterListener(emitter: {
        on: Function;
        off: Function;
    }, eventName: string, listener: Function): () => void;
    /**
     * Creates a wrapped listener that can be removed later
     * @param originalListener The original listener function
     * @param wrapper Function that wraps the original listener
     * @returns Wrapped listener that maintains a reference to the original
     */
    createWrappedListener<T extends Function>(originalListener: T, wrapper: (listener: T) => Function): Function;
    /**
     * Stores a listener in the internal maps
     * @param target The event target or emitter
     * @param eventName The name of the event
     * @param listener The event handler function
     * @param options Optional listener options
     */
    private storeListener;
    /**
     * Removes a listener from the internal store
     * @param target The event target or emitter
     * @param eventName The name of the event
     * @param listener The event handler function to remove
     */
    private removeListenerFromStore;
    /**
     * Removes all listeners for a specific event from a target
     * @param target The event target or emitter
     * @param eventName The name of the event
     */
    removeAllListeners(target: EventTarget | {
        off?: Function;
        removeAllListeners?: Function;
    }, eventName?: string): void;
    /**
     * Checks if a target has any listeners for a specific event
     * @param target The event target or emitter
     * @param eventName Optional event name to check
     * @returns True if the target has listeners for the specified event
     */
    hasListeners(target: EventTarget | object, eventName?: string): boolean;
    /**
     * Gets the number of listeners for a specific event
     * @param target The event target or emitter
     * @param eventName Optional event name to count
     * @returns The number of listeners
     */
    listenerCount(target: EventTarget | object, eventName?: string): number;
}
/**
 * A singleton instance of the cleanup manager
 */
export declare const cleanupManager: EventCleanupManager;
/**
 * Helper function to add a DOM event listener with automatic cleanup
 */
export declare const addDOMListener: (target: EventTarget, eventName: string, listener: EventListener, options?: AddEventListenerOptions) => (() => void);
/**
 * Helper function to add an EventEmitter listener with automatic cleanup
 */
export declare const addEmitterListener: (emitter: {
    on: Function;
    off: Function;
}, eventName: string, listener: Function) => (() => void);
/**
 * Integration with the RushStream API for automatic listener cleanup
 * @param targets DOM elements or EventEmitters to watch
 * @returns Object with cleanup functions
 */
export declare const createEventCleanup: (targets: Array<EventTarget | {
    on: Function;
    off: Function;
}>) => {
    cleanup: () => void;
    count: () => number;
    addDOMListener: typeof addDOMListener;
    addEmitterListener: typeof addEmitterListener;
};
