/** Interface for the RushObserver */
export interface RushObserverImpl<T> {

  /** Emits the next value */
  readonly next: (value: T) => void;

  /** Emits an error */
  readonly error: (err: unknown) => void;

  /** Emits the completion event */
  readonly complete: () => void;
}

/** Partial type for observer's stream options */
export type RushObserveStream<T> = Partial<RushObserverImpl<T>>;


/**
 * Observer that emits values, errors, and completion events with chained handler support
 * @template T - Type of values emitted by the observer
 * @implements {RushObserverImpl}
 */
export class RushObserver<T = any> implements RushObserverImpl<T> {
  /** Handler for 'next' events, chained for multiple listeners */
  private nextHandler: ((value: T) => void) | null = null;

  /** Handler for 'error' events, chained for multiple error listeners */
  private errorHandler: ((err: unknown) => void) | null = null;

  /** Handler for 'complete' events, chained for multiple completion listeners */
  private completeHandler: (() => void) | null = null;

  /**
   * Creates a new RushObserver instance
   * @param options - Configuration options, including error continuation
   */
  constructor(private options: { continueOnError?: boolean } = {}) { }

  /**
   * Emits a value to all chained 'next' handlers
   * @param value - The value to emit
   */
  next(value: T): void {
    if (this.nextHandler) this.nextHandler(value);
  }

  /**
   * Emits an error to all chained 'error' handlers
   * @param err - The error to emit
   */
  error(err: unknown): void {
    if (this.errorHandler) {
      this.errorHandler(err);
      if (!this.options?.continueOnError) this.destroy();
    }
  }

  /** Signals completion to all chained 'complete' handlers */
  complete(): void {
    if (this.completeHandler) {
      this.completeHandler();
    }
    this.on('complete', () => { });
    this.on('error', () => { });
    this.on('next', () => { });
    this.cleanHandlers();
  }

  /**
   * Registers a handler for a specific event type, chaining with existing handlers
   * @param event - Event type ('next', 'error', 'complete')
   * @param handler - Callback function to handle the event
   */
  on(event: 'next' | 'error' | 'complete', handler: (...args: any[]) => void): void {
    switch (event) {
      case 'next':
        const prevNext = this.nextHandler;
        this.nextHandler = prevNext
          ? (value: T) => {
              prevNext(value);
              (handler as (value: T) => void)(value);
            }
          : (handler as (value: T) => void);
        break;

      case 'error':
        const prevError = this.errorHandler;
        this.errorHandler = prevError
          ? (err: unknown) => {
              prevError(err);
              (handler as (err: unknown) => void)(err);
            }
          : (handler as (err: unknown) => void);
        break;

      case 'complete':
        const prevComplete = this.completeHandler;
        this.completeHandler = prevComplete
          ? () => {
              prevComplete();
              (handler as () => void)();
            }
          : (handler as () => void);
        break;
    }
  }

  /** Destroys the observer, marking it as completed and clearing handlers */
  destroy(): void {
    this.cleanHandlers();
  }

  /** Clears all event handlers to free resources */
  private cleanHandlers(): void {
    this.nextHandler = null;
    this.errorHandler = null;
    this.completeHandler = null;
  }
}
