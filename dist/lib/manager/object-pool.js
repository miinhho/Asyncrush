"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolableEvent = exports.ObjectPool = void 0;
exports.createEventPool = createEventPool;
/**
 * A generic object pool to reduce garbage collection pressure
 * for frequently created and discarded objects.
 * @template T The type of objects in the pool
 */
class ObjectPool {
    /**
     * Creates a new object pool
     * @param factory Function to create new objects
     * @param options Configuration options
     */
    constructor(factory, options = {}) {
        /** Storage for unused objects */
        this.pool = [];
        this.factory = factory;
        this.maxSize = options.maxSize || 100;
        this.reset = options.reset;
        const initialSize = options.initialSize || 0;
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
    }
    /**
     * Acquires an object from the pool or creates a new one if the pool is empty
     * @returns An object of type T
     */
    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.factory();
    }
    /**
     * Returns an object to the pool for future reuse
     * @param obj The object to return to the pool
     */
    release(obj) {
        if (this.pool.length < this.maxSize) {
            if (this.reset) {
                this.reset(obj);
            }
            this.pool.push(obj);
        }
    }
    /**
     * Clears all objects from the pool
     */
    clear() {
        this.pool.length = 0;
    }
    /**
     * Gets the current size of the pool
     */
    get size() {
        return this.pool.length;
    }
}
exports.ObjectPool = ObjectPool;
/**
 * A specialized event object that can be pooled and reused
 * @template T The type of data carried by the event
 */
class PoolableEvent {
    constructor() {
        /** Event type identifier */
        this.type = '';
        /** Timestamp when the event was created */
        this.timestamp = 0;
    }
    /**
     * Initializes or reinitializes the event with new data
     * @param type Event type identifier
     * @param data Data payload
     * @param source Event source
     * @returns This instance for chaining
     */
    init(type, data, source) {
        this.type = type;
        this.data = data;
        this.source = source;
        this.timestamp = Date.now();
        this.meta = {};
        return this;
    }
    /**
     * Resets the event for reuse
     */
    reset() {
        this.type = '';
        this.data = undefined;
        this.source = undefined;
        this.timestamp = 0;
        this.meta = undefined;
    }
}
exports.PoolableEvent = PoolableEvent;
/**
 * Factory function to create event pools for specific event types
 * @template T The type of data carried by the events
 * @param initialSize Initial number of events to create
 * @param maxSize Maximum pool size
 * @returns A configured object pool for events
 */
function createEventPool(initialSize = 10, maxSize = 100) {
    return new ObjectPool(() => new PoolableEvent(), {
        initialSize,
        maxSize,
        reset: (event) => event.reset(),
    });
}
