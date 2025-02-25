/**
 * Processor that controls the emission of values with debounce or throttle
 * @template T - The type of values processed
 */
export declare class RushEventProcessor<T> {
    private emitFn;
    /** Debounce time in milliseconds */
    private debounceMs;
    /** Timeout for debounce control */
    private debounceTimeout;
    /** Last value for debounce */
    private lastValue;
    /** Throttle time in milliseconds */
    private throttleMs;
    /** Timeout for throttle control */
    private throttleTimeout;
    /**
     * Creates a new RushEventProcessor instance
     * @param emitFn - Function to emit the processed value
     */
    constructor(emitFn: (value: T) => void);
    /** Set the debounce time in milliseconds  */
    setDebounce(ms: number): this;
    /** Set the throttle time in milliseconds  */
    setThrottle(ms: number): this;
    /**
     * Processes an event with debounce or throttle control
     * @param value - Value to process
     */
    process(value: T): void;
}
