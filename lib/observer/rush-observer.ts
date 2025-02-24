import { RushObserverImpl } from "./rush-observer.types";

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

  /** Flag indicating if the observer has completed */
  private isCompleted: boolean = false;

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
    if (this.isCompleted) return;
    if (this.nextHandler) {
      this.nextHandler(value);
    }
  }

  /**
   * Emits an error to all chained 'error' handlers
   * @param err - The error to emit
   */
  error(err: unknown): void {
    if (!this.isCompleted && this.errorHandler) {
      this.errorHandler(err);
      if (!this.options?.continueOnError) {
        this.destroy();
      }
    }
  }

  /**
   * Signals completion to all chained 'complete' handlers
   */
  complete(): void {
    if (!this.isCompleted && this.completeHandler) {
      this.isCompleted = true;
      this.completeHandler();
      this.cleanHandlers();
    }
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

  /**
   * Destroys the observer, marking it as completed and clearing handlers
   */
  destroy(): void {
    this.isCompleted = true;
    this.cleanHandlers();
  }

  /**
   * Clears all event handlers to free resources
   */
  private cleanHandlers(): void {
    this.nextHandler = null;
    this.errorHandler = null;
    this.completeHandler = null;
  }
}
