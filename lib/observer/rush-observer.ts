import { RushObserverImpl } from '../';

/**
 * Observer that emits values, errors, and completion events with handler support
 * @template T - Type of values emitted by the observer
 * @implements {RushObserverImpl}
 */
export class RushObserver<T = any> implements RushObserverImpl<T> {
  /** Handler for 'next' events, chained for multiple listeners */
  protected nextHandler?: (value: T) => void;

  /** Handler for 'error' events */
  protected errorHandler?: (err: unknown) => void;

  /** Handler for 'complete' events */
  protected completeHandler?: () => void;

  /** Flag to enable error continuation */
  protected continueOnError: boolean = false;

  /**
   * Creates a new RushObserver instance
   * @param options - Whether to continue on error
   */
  constructor(options: { continueOnError?: boolean } = {}) {
    this.continueOnError = !!options.continueOnError;
  }

  /** Emits a value to all chained 'next' handlers */
  next(value: T): void {
    if (this.nextHandler) this.nextHandler(value);
  }

  /** Emits an error to 'error' handlers */
  error(err: unknown): void {
    if (this.errorHandler) this.errorHandler(err);
    if (!this.continueOnError) this.destroy();
  }

  /** Signals completion to 'complete' handlers */
  complete(): void {
    if (this.completeHandler) this.completeHandler();
    this.cleanHandlers();
  }

  /**
   * Adds a handlers for 'next' events, chaining with existing handlers
   * @param handlers - The handlers to add
   */
  onNext(handler: (value: T) => void): void {
    const prevNext = this.nextHandler;
    this.nextHandler = (value: T) => {
      try {
        if (prevNext) prevNext(value);
        handler(value);
      } catch (err) {
        this.error(err);
      }
    };
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
    this.nextHandler = undefined;
    this.errorHandler = undefined;
    this.completeHandler = undefined;
  }
}
