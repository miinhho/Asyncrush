import { RushObserverImpl } from "./rush-observer.types";

/**
 * An observer that can emit values, errors and completion events
 * @implements {RushObserverImpl}
 */
export class RushObserver<T = any> implements RushObserverImpl<T> {
  private nextHandler: ((value: T) => void) | null = null;
  private errorHandler: ((err: unknown) => void) | null = null;
  private completeHandler: (() => void) | null = null;
  private isCompleted: boolean = false;

  constructor(private options: { continueOnError?: boolean } = {}) {}

  next(value: T): void {
    if (!this.isCompleted && this.nextHandler) this.nextHandler(value);
  }

  error(err: unknown): void {
    if (!this.isCompleted && this.errorHandler) this.errorHandler(err);
    if (!this.options?.continueOnError) this.destroy();
  }

  complete(): void {
    if (!this.isCompleted && this.completeHandler) {
      this.isCompleted = true;
      this.completeHandler();
      this.cleanHandlers();
    }
  }

  on(event: 'next' | 'error' | 'complete', handler: (...args: any[]) => void): void {
    if (this.isCompleted) return;
    if (event === 'next') {
      const prevHandler = this.nextHandler;
      this.nextHandler = prevHandler
        ? (value: T) => {
            prevHandler(value);
            (handler as (value: T) => void)(value);
          }
        : (handler as (value: T) => void);
    } else if (event === 'error') {
      const prevHandler = this.errorHandler;
      this.errorHandler = prevHandler
        ? (err: unknown) => {
            prevHandler(err);
            (handler as (err: unknown) => void)(err);
          }
        : (handler as (err: unknown) => void);
    } else if (event === 'complete') {
      const prevHandler = this.completeHandler;
      this.completeHandler = prevHandler
        ? () => {
            prevHandler();
            (handler as () => void)();
          }
        : (handler as () => void);
    }
  }

  destroy(): void {
    this.isCompleted = true;
    this.cleanHandlers();
  }

  private cleanHandlers(): void {
    this.nextHandler = null;
    this.errorHandler = null;
    this.completeHandler = null;
  }
}
