/**
 * A buffer to store events when paused
 * @template T - Type of the buffers
 */
export declare class RushBuffer<T> {
    /** Buffer to store events when paused */
    private buffer;
    /** Flag to pause the stream */
    private isPaused;
    /** Maximum size of the buffer */
    private size;
    /**
     * Creates a new RushBuffer instance
     * @param maxsize - Maximum size of the buffer
     */
    constructor(size?: number);
    /** Pauses the stream, buffering events if enabled */
    pause(): this;
    /**
     * Resumes the stream, flushing buffered events
     * @param processFn - Function to process buffered events
    */
    resume(processFn: (value: T) => void): this;
    /**
     * Add a value to the buffer
     * @param value
     */
    add(value: T): this;
    /** Get the stream is paused or not */
    get paused(): boolean;
    /** Get the maximum buffer size */
    set maxSize(size: number);
    /** Set the maximum buffer size */
    get maxSize(): number;
}
