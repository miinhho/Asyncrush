/**
 * A generic object pool to reduce garbage collection pressure
 * for frequently created and discarded objects.
 * @template T The type of objects in the pool
 */
export declare class ObjectPool<T> {
    /** Storage for unused objects */
    private pool;
    /** Maximum size of the pool to prevent excessive memory usage */
    private readonly maxSize;
    /** Factory function to create new objects when pool is empty */
    private readonly factory;
    /** Optional reset function to prepare objects for reuse */
    private readonly reset?;
    /**
     * Creates a new object pool
     * @param factory Function to create new objects
     * @param options Configuration options
     */
    constructor(factory: () => T, options?: {
        initialSize?: number;
        maxSize?: number;
        reset?: (obj: T) => void;
    });
    /**
     * Acquires an object from the pool or creates a new one if the pool is empty
     * @returns An object of type T
     */
    acquire(): T;
    /**
     * Returns an object to the pool for future reuse
     * @param obj The object to return to the pool
     */
    release(obj: T): void;
    /**
     * Clears all objects from the pool
     */
    clear(): void;
    /**
     * Gets the current size of the pool
     */
    get size(): number;
}
/**
 * A specialized event object that can be pooled and reused
 * @template T The type of data carried by the event
 */
export declare class PoolableEvent<T = any> {
    /** Event type identifier */
    type: string;
    /** Timestamp when the event was created */
    timestamp: number;
    /** Data payload carried by the event */
    data?: T;
    /** Source that generated the event */
    source?: any;
    /** Additional metadata for the event */
    meta?: Record<string, any>;
    /**
     * Initializes or reinitializes the event with new data
     * @param type Event type identifier
     * @param data Data payload
     * @param source Event source
     * @returns This instance for chaining
     */
    init(type: string, data?: T, source?: any): this;
    /**
     * Resets the event for reuse
     */
    reset(): void;
}
/**
 * Factory function to create event pools for specific event types
 * @template T The type of data carried by the events
 * @param initialSize Initial number of events to create
 * @param maxSize Maximum pool size
 * @returns A configured object pool for events
 */
export declare function createEventPool<T>(initialSize?: number, maxSize?: number): ObjectPool<PoolableEvent<T>>;
