import { RushObserverImpl } from "../types";

/**
 * Observer that emits values, errors, and completion events with handler support
 * @template T - Type of values emitted by the observer
 * @implements {RushObserverImpl}
 */
export class RushObserver<T = any> implements RushObserverImpl<T> {
  /** Handler for 'next' events, chained for multiple listeners */
  private nextHandler: ((value: T) => void) | null = null;

  /** Handler for 'error' events */
  private errorHandler: ((err: unknown) => void) | null = null;

  /** Handler for 'complete' events */
  private completeHandler: (() => void) | null = null;

  /** Flag to enable error continuation */
  protected continueOnError: boolean = false;

  /**
   * Creates a new RushObserver instance
   * @param options - Whether to continue on error
   */
  constructor(options: { continueOnError?: boolean } = {}) {
    if (options.continueOnError) this.continueOnError = options.continueOnError;
  }

  /**
   * Emits a value to all chained 'next' handlers
   * @param value - The value to emit
   */
  next(value: T): void {
    if (this.nextHandler) this.nextHandler(value);
  }

  /**
   * Emits an error to 'error' handlers
   * @param err - The error to emit
   */
  error(err: unknown): void {
    if (this.errorHandler) {
      this.errorHandler(err);
      if (!this.continueOnError) this.destroy();
    }
  }

  /** Signals completion to all chained 'complete' handlers */
  complete(): void {
    if (this.completeHandler) {
      this.completeHandler();
    }
    this.onComplete(() => { });
    this.onError(() => { });
    this.onNext(() => { });
    this.cleanHandlers();
  }

  /**
   * Adds a handlers for 'next' events
   * @param handlers - The handlers to add
   */
  onNext(handler: (...args: any[]) => void): void {
    const prevNext = this.nextHandler;
    this.nextHandler = prevNext
      ? (value: T) => {
          prevNext(value);
          (handler as (value: T) => void)(value);
        }
      : (handler as (value: T) => void);
  }

  /**
   * Adds a handler for 'error' events
   * @param handler - The handler to add
   */
  onError(handler: (err: unknown) => void): void {
    this.errorHandler = handler;
  }

  /**
   * Adds a handler for 'complete' events
   * @param handler - The handler to add
   */
  onComplete(handler: () => void): void {
    this.completeHandler = handler;
  }

  /** Destroys the observer, and clearing handlers */
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
