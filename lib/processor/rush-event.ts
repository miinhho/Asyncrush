/**
 * Processor that controls the emission of values with debounce or throttle
 * @template T - The type of values processed
 */
export class RushEventProcessor<T> {
  /** Debounce time in milliseconds */
  private debounceMs: number | null = null;
  /** Timeout for debounce control */
  private debounceTimeout: NodeJS.Timeout | null = null;
  /** Last value for debounce */
  private lastValue: T | null = null;

  /** Throttle time in milliseconds */
  private throttleMs: number | null = null;
  /** Timeout for throttle control */
  private throttleTimeout: NodeJS.Timeout | null = null;

  /**
   * Creates a new RushEventProcessor instance
   * @param emitFn - Function to emit the processed value
   */
  constructor(private emitFn: (value: T) => void) { }

  /** Set the debounce time in milliseconds  */
  setDebounce(ms: number): this {
    this.debounceMs = ms;
    return this;
  }

  /** Set the throttle time in milliseconds  */
  setThrottle(ms: number): this {
    this.throttleMs = ms;
    return this;
  }

  /**
   * Processes an event with debounce or throttle control
   * @param value - Value to process
   */
  process(value: T) {
    if (this.debounceMs !== null) {
      this.lastValue = value;
      if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        if (this.lastValue !== null) {
          this.emitFn(this.lastValue);
          this.lastValue = null;
        }
      }, this.debounceMs);
    } else if (this.throttleMs !== null) {
      if (!this.throttleTimeout) {
        this.emitFn(value);
        this.throttleTimeout = setTimeout(() => {
          this.throttleTimeout = null;
        }, this.throttleMs);
      }
    } else {
      this.emitFn(value);
    }
  }
}
