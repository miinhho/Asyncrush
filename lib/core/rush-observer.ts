import { RushObserverImpl } from '../types';

/**
 * Optimized observer that emits values, errors, and completion events with handler support
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
  protected continueOnError: boolean;

  /** Flag indicating if the observer is active */
  protected isActive: boolean = true;

  /**
   * Creates a new RushObserver instance
   * @param options - Whether to continue on error
   */
  constructor(options: { continueOnError?: boolean } = {}) {
    this.continueOnError = !!options.continueOnError;
  }

  /**
   * Emits a value to 'next' handlers
   * @param value - The value to emit
   */
  next(value: T): void {
    if (!this.isActive) return;

    if (this.nextHandler) {
      try {
        this.nextHandler(value);
      } catch (err) {
        this.error(err);
      }
    }
  }

  /**
   * Emits an error to 'error' handlers
   * @param err - The error to emit
   */
  error(err: unknown): void {
    if (!this.isActive) return;

    if (this.errorHandler) {
      try {
        this.errorHandler(err);
      } catch (nestedError) {
        console.error('Error in error handler:', nestedError);
      }
    }

    if (!this.continueOnError) this.destroy();
  }

  /**
   * Signals completion to 'complete' handlers
   */
  complete(): void {
    if (!this.isActive) return;

    if (this.completeHandler) {
      try {
        this.completeHandler();
      } catch (err) {
        console.error('Error in complete handler:', err);
      }
    }

    this.cleanHandlers();
    this.isActive = false;
  }

  /**
   * Adds a handler for 'next' events
   * @param handler - The handler to add
   */
  onNext(handler: (value: T) => void): void {
    if (!this.isActive) return;
    this.nextHandler = handler;
  }

  /**
   * Adds a handler for 'error' events
   * @param handler - The handler to add
   */
  onError(handler: (err: unknown) => void): void {
    if (!this.isActive) return;
    this.errorHandler = handler;
  }

  /**
   * Adds a handler for 'complete' events
   * @param handler - The handler to add
   */
  onComplete(handler: () => void): void {
    if (!this.isActive) return;
    this.completeHandler = handler;
  }

  /**
   * Destroys the observer, clearing handlers
   */
  destroy(): void {
    this.cleanHandlers();
    this.isActive = false;
  }

  /**
   * Checks if the observer is active
   */
  isDestroyed(): boolean {
    return !this.isActive;
  }

  /**
   * Clears all event handlers to free resources
   */
  private cleanHandlers(): void {
    this.nextHandler = undefined;
    this.errorHandler = undefined;
    this.completeHandler = undefined;
  }
}
