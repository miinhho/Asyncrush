/**
 * A buffer to store events when paused
 * @template T - Type of the buffers
 */
export class RushBuffer<T> {
  /** Buffer to store events when paused */
  private buffer: T[] | null = null;
  /** Flag to pause the stream */
  private isPaused = false;
  /** Maximum size of the buffer */
  private size: number;

  /**
   * Creates a new RushBuffer instance
   * @param maxsize - Maximum size of the buffer
   */
  constructor(size: number = 0) {
    this.size = size;
    if (size > 0) {
      this.buffer = [];
    }
  }

  /** Pauses the stream, buffering events if enabled */
  pause(): this {
    this.isPaused = true;
    return this;
  }

  /**
   * Resumes the stream, flushing buffered events
   * @param processFn - Function to process buffered events
  */
  resume(processFn: (value: T) => void): this {
    this.isPaused = false;
    if (this.buffer) {
      while (this.buffer.length > 0 && !this.isPaused) {
        processFn(this.buffer?.shift()!);
      }
    }
    return this;
  }

  /**
   * Add a value to the buffer
   * @param value
   */
  add(value: T): this {
    if (this.buffer) {
      if (this.buffer.length >= this.maxSize) {
        this.buffer.shift();
      }
      this.buffer.push(value);
    }
    return this;
  }

  /** Get the stream is paused or not */
  get paused(): boolean {
    return this.isPaused;
  }

  /** Get the maximum buffer size */
  set maxSize(size: number) {
    this.size = size;
  }

  /** Set the maximum buffer size */
  get maxSize(): number {
    return this.size;
  }
}
