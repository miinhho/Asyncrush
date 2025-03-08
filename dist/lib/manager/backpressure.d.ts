import { BackpressureOptions, BackpressureResult } from '../types';
/**
 * Backpressure mode options to control flow
 */
export declare enum BackpressureMode {
    /** Drop events when buffer is full */
    DROP = "drop",
    /** Notify producer to pause when buffer reaches high watermark */
    NOTIFY = "notify",
    /** Wait for buffer space by returning a Promise */
    WAIT = "wait"
}
/**
 * Default backpressure options
 */
export declare const DEFAULT_BACKPRESSURE_OPTIONS: BackpressureOptions;
/**
 * Manages backpressure for streams
 * @template T Type of values in the buffer
 */
export declare class BackpressureController<T> {
    /** Buffer of pending items */
    private buffer;
    /** Maximum buffer size */
    private highWatermark;
    /** Buffer level to resume normal flow */
    private lowWatermark;
    /** Current backpressure handling mode */
    private mode;
    /** Maximum time to wait in WAIT mode */
    private waitTimeout?;
    /** Signal when buffer has space for WAIT mode */
    private waitResolvers;
    /** Flow state */
    private paused;
    /** Registered callbacks for state changes */
    private listeners;
    /**
     * Creates a new BackpressureController
     * @param options Configuration options
     */
    constructor(options?: Partial<BackpressureOptions>);
    /**
     * Checks if the buffer has reached high watermark
     */
    private isBackpressured;
    /**
     * Checks if the buffer has drained to low watermark
     */
    private isDrained;
    /**
     * Notifies producer to pause
     */
    private notifyPause;
    /**
     * Notifies producer to resume
     */
    private notifyResume;
    /**
     * Notifies about dropped values
     * @param value The value that was dropped
     */
    private notifyDrop;
    /**
     * Resolves waiting promises when buffer has space
     */
    private resolveWaiters;
    /**
     * Attempts to add a value to the buffer with backpressure handling
     * @param value The value to add
     * @returns Result indicating if the value was accepted and any wait promise
     */
    push(value: T): BackpressureResult<T>;
    /**
     * Takes the next value from the buffer
     * @returns The next value or undefined if buffer is empty
     */
    take(): T | undefined;
    /**
     * Takes multiple values from the buffer
     * @param count Maximum number of items to take
     * @returns Array of taken values
     */
    takeMany(count: number): T[];
    /**
     * Registers a callback for pause events
     * @param callback Function to call when producer should pause
     * @returns Function to unregister the callback
     */
    onPause(callback: () => void): () => void;
    /**
     * Registers a callback for resume events
     * @param callback Function to call when producer can resume
     * @returns Function to unregister the callback
     */
    onResume(callback: () => void): () => void;
    /**
     * Registers a callback for drop events
     * @param callback Function to call when a value is dropped
     * @returns Function to unregister the callback
     */
    onDrop(callback: (value: T) => void): () => void;
    /**
     * Gets the current buffer size
     */
    get size(): number;
    /**
     * Checks if the buffer is empty
     */
    get isEmpty(): boolean;
    /**
     * Gets the current pause state
     */
    get isPaused(): boolean;
    /**
     * Changes the backpressure mode
     * @param mode New backpressure mode
     */
    setMode(mode: BackpressureMode): void;
    /**
     * Updates the watermark levels
     * @param highWatermark New high watermark
     * @param lowWatermark New low watermark
     */
    setWatermarks(highWatermark: number, lowWatermark: number): void;
    /**
     * Clears the buffer and resets the controller
     */
    clear(): void;
}
