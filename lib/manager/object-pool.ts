/**
 * A generic object pool to reduce garbage collection pressure
 * for frequently created and discarded objects.
 * @template T The type of objects in the pool
 */
export class ObjectPool<T> {
  /** Storage for unused objects */
  private pool: T[] = [];

  /** Maximum size of the pool to prevent excessive memory usage */
  private readonly maxSize: number;

  /** Factory function to create new objects when pool is empty */
  private readonly factory: () => T;

  /** Optional reset function to prepare objects for reuse */
  private readonly reset?: (obj: T) => void;

  /**
   * Creates a new object pool
   * @param factory Function to create new objects
   * @param options Configuration options
   */
  constructor(
    factory: () => T,
    options: {
      initialSize?: number;
      maxSize?: number;
      reset?: (obj: T) => void;
    } = {}
  ) {
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
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /**
   * Returns an object to the pool for future reuse
   * @param obj The object to return to the pool
   */
  release(obj: T): void {
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
  clear(): void {
    this.pool.length = 0;
  }

  /**
   * Gets the current size of the pool
   */
  get size(): number {
    return this.pool.length;
  }
}

/**
 * A specialized event object that can be pooled and reused
 * @template T The type of data carried by the event
 */
export class PoolableEvent<T = any> {
  /** Event type identifier */
  public type: string = '';

  /** Timestamp when the event was created */
  public timestamp: number = 0;

  /** Data payload carried by the event */
  public data?: T;

  /** Source that generated the event */
  public source?: any;

  /** Additional metadata for the event */
  public meta?: Record<string, any>;

  /**
   * Initializes or reinitializes the event with new data
   * @param type Event type identifier
   * @param data Data payload
   * @param source Event source
   * @returns This instance for chaining
   */
  init(type: string, data?: T, source?: any): this {
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
  reset(): void {
    this.type = '';
    this.data = undefined;
    this.source = undefined;
    this.timestamp = 0;
    this.meta = undefined;
  }
}

/**
 * Factory function to create event pools for specific event types
 * @template T The type of data carried by the events
 * @param initialSize Initial number of events to create
 * @param maxSize Maximum pool size
 * @returns A configured object pool for events
 */
export function createEventPool<T>(
  initialSize = 10,
  maxSize = 100
): ObjectPool<PoolableEvent<T>> {
  return new ObjectPool<PoolableEvent<T>>(() => new PoolableEvent<T>(), {
    initialSize,
    maxSize,
    reset: (event) => event.reset(),
  });
}
