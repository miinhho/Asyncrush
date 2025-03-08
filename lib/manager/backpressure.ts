import { BackpressureOptions, BackpressureResult } from '../types';

/**
 * Backpressure mode options to control flow
 */
export enum BackpressureMode {
  /** Drop events when buffer is full */
  DROP = 'drop',

  /** Notify producer to pause when buffer reaches high watermark */
  NOTIFY = 'notify',

  /** Wait for buffer space by returning a Promise */
  WAIT = 'wait',
}

/**
 * Default backpressure options
 */
export const DEFAULT_BACKPRESSURE_OPTIONS: BackpressureOptions = {
  highWatermark: 1000,
  lowWatermark: 200,
  mode: BackpressureMode.NOTIFY,
  waitTimeout: 30000,
};

/**
 * Manages backpressure for streams
 * @template T Type of values in the buffer
 */
export class BackpressureController<T> {
  /** Buffer of pending items */
  private buffer: T[] = [];

  /** Maximum buffer size */
  private highWatermark: number;

  /** Buffer level to resume normal flow */
  private lowWatermark: number;

  /** Current backpressure handling mode */
  private mode: BackpressureMode;

  /** Maximum time to wait in WAIT mode */
  private waitTimeout?: number;

  /** Signal when buffer has space for WAIT mode */
  private waitResolvers: Array<{
    resolve: () => void;
    timer?: NodeJS.Timeout;
  }> = [];

  /** Flow state */
  private paused: boolean = false;

  /** Registered callbacks for state changes */
  private listeners: {
    pause: Set<() => void>;
    resume: Set<() => void>;
    drop: Set<(value: T) => void>;
  } = {
    pause: new Set(),
    resume: new Set(),
    drop: new Set(),
  };

  /**
   * Creates a new BackpressureController
   * @param options Configuration options
   */
  constructor(options: Partial<BackpressureOptions> = {}) {
    const config = { ...DEFAULT_BACKPRESSURE_OPTIONS, ...options };

    this.highWatermark = config.highWatermark;
    this.lowWatermark = config.lowWatermark;
    this.mode = config.mode;
    this.waitTimeout = config.waitTimeout;

    if (this.lowWatermark >= this.highWatermark) {
      throw new Error(
        '[Asyncrush] lowWatermark must be less than highWatermark'
      );
    }
  }

  /**
   * Checks if the buffer has reached high watermark
   */
  private isBackpressured(): boolean {
    return this.buffer.length >= this.highWatermark;
  }

  /**
   * Checks if the buffer has drained to low watermark
   */
  private isDrained(): boolean {
    return this.paused && this.buffer.length <= this.lowWatermark;
  }

  /**
   * Notifies producer to pause
   */
  private notifyPause(): void {
    if (!this.paused) {
      this.paused = true;
      this.listeners.pause.forEach((callback) => {
        try {
          callback();
        } catch (err) {
          console.error('[Asyncrush] Error in pause listener:', err);
        }
      });
    }
  }

  /**
   * Notifies producer to resume
   */
  private notifyResume(): void {
    if (this.paused) {
      this.paused = false;
      this.listeners.resume.forEach((callback) => {
        try {
          callback();
        } catch (err) {
          console.error('[Asyncrush] Error in resume listener:', err);
        }
      });
    }
  }

  /**
   * Notifies about dropped values
   * @param value The value that was dropped
   */
  private notifyDrop(value: T): void {
    this.listeners.drop.forEach((callback) => {
      try {
        callback(value);
      } catch (err) {
        console.error('[Asyncrush] Error in drop listener:', err);
      }
    });
  }

  /**
   * Resolves waiting promises when buffer has space
   */
  private resolveWaiters(): void {
    const count = Math.min(
      this.waitResolvers.length,
      this.highWatermark - this.buffer.length
    );

    for (let i = 0; i < count; i++) {
      const { resolve, timer } = this.waitResolvers.shift()!;
      if (timer) {
        clearTimeout(timer);
      }
      resolve();
    }
  }

  /**
   * Attempts to add a value to the buffer with backpressure handling
   * @param value The value to add
   * @returns Result indicating if the value was accepted and any wait promise
   */
  push(value: T): BackpressureResult<T> {
    if (this.isDrained()) this.notifyResume();

    if (this.isBackpressured()) {
      switch (this.mode) {
        case BackpressureMode.DROP: {
          this.notifyDrop(value);
          return { accepted: false };
        }
        case BackpressureMode.NOTIFY: {
          this.notifyPause();
          this.buffer.push(value);
          return { accepted: true, value };
        }
        case BackpressureMode.WAIT: {
          let waitResolve: () => void;
          let waitTimer: NodeJS.Timeout | undefined;

          const waitPromise = new Promise<void>((resolve, reject) => {
            waitResolve = resolve;
            if (this.waitTimeout) {
              waitTimer = setTimeout(() => {
                const index = this.waitResolvers.findIndex(
                  (r) => r.resolve === waitResolve
                );
                if (index >= 0) {
                  this.waitResolvers.splice(index, 1);
                }
                reject(
                  new Error('[Asyncrush] Backpressure wait timeout exceeded')
                );
              }, this.waitTimeout);
            }
          });

          this.waitResolvers.push({ resolve: waitResolve!, timer: waitTimer });
          this.notifyPause();

          return {
            accepted: false,
            waitPromise: waitPromise.then(() => {
              this.buffer.push(value);
            }),
          };
        }
      }
    }

    this.buffer.push(value);
    return { accepted: true, value };
  }

  /**
   * Takes the next value from the buffer
   * @returns The next value or undefined if buffer is empty
   */
  take(): T | undefined {
    const value = this.buffer.shift();

    if (this.waitResolvers.length > 0 && !this.isBackpressured()) {
      this.resolveWaiters();
    }
    if (this.isDrained()) {
      this.notifyResume();
    }
    return value;
  }

  /**
   * Takes multiple values from the buffer
   * @param count Maximum number of items to take
   * @returns Array of taken values
   */
  takeMany(count: number): T[] {
    const result: T[] = [];
    const takeCount = Math.min(count, this.buffer.length);

    for (let i = 0; i < takeCount; i++) {
      result.push(this.buffer.shift()!);
    }

    if (this.waitResolvers.length > 0 && !this.isBackpressured()) {
      this.resolveWaiters();
    }
    if (this.isDrained()) {
      this.notifyResume();
    }

    return result;
  }

  /**
   * Registers a callback for pause events
   * @param callback Function to call when producer should pause
   * @returns Function to unregister the callback
   */
  onPause(callback: () => void): () => void {
    this.listeners.pause.add(callback);
    return () => this.listeners.pause.delete(callback);
  }

  /**
   * Registers a callback for resume events
   * @param callback Function to call when producer can resume
   * @returns Function to unregister the callback
   */
  onResume(callback: () => void): () => void {
    this.listeners.resume.add(callback);
    return () => this.listeners.resume.delete(callback);
  }

  /**
   * Registers a callback for drop events
   * @param callback Function to call when a value is dropped
   * @returns Function to unregister the callback
   */
  onDrop(callback: (value: T) => void): () => void {
    this.listeners.drop.add(callback);
    return () => this.listeners.drop.delete(callback);
  }

  /**
   * Gets the current buffer size
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Checks if the buffer is empty
   */
  get isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  /**
   * Gets the current pause state
   */
  get isPaused(): boolean {
    return this.paused;
  }

  /**
   * Changes the backpressure mode
   * @param mode New backpressure mode
   */
  setMode(mode: BackpressureMode): void {
    this.mode = mode;
  }

  /**
   * Updates the watermark levels
   * @param highWatermark New high watermark
   * @param lowWatermark New low watermark
   */
  setWatermarks(highWatermark: number, lowWatermark: number): void {
    if (lowWatermark >= highWatermark) {
      throw new Error(
        '[Asyncrush] lowWatermark must be less than highWatermark'
      );
    }

    this.highWatermark = highWatermark;
    this.lowWatermark = lowWatermark;

    if (this.buffer.length >= this.highWatermark && !this.paused) {
      this.notifyPause();
    } else if (this.buffer.length <= this.lowWatermark && this.paused) {
      this.notifyResume();
    }
  }

  /**
   * Clears the buffer and resets the controller
   */
  clear(): void {
    this.buffer = [];

    this.waitResolvers.forEach(({ resolve, timer }) => {
      if (timer) {
        clearTimeout(timer);
      }
      resolve();
    });
    this.waitResolvers = [];
    if (this.paused) {
      this.notifyResume();
    }
  }
}
