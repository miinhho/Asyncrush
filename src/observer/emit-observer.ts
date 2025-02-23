import { EmitObserverImpl } from "./emit-observer.types";

/**
 * An observer that can emit values, errors and completion events
 * @extends EventEmitter
 * @implements {EmitObserverImpl}
 */
export class EmitObserver<T = any> implements EmitObserverImpl<T> {
  private nextHandlers: ((value: T) => void)[] = [];
  private errorHandlers: ((err: unknown) => void)[] = [];
  private completeHandlers: (() => void)[] = [];
  private isCompleted: boolean = false;

  constructor(private options: { continueOnError?: boolean } = {}) {}

  next(value: T): void {
    if (this.isCompleted) return;
    for (const handler of this.nextHandlers) {
      handler(value);
    }
  }

  error(err: unknown): void {
    if (this.isCompleted) return;
    for (const handler of this.errorHandlers) handler(err);
    if (!this.options?.continueOnError) {
      this.isCompleted = true;
      this.cleanHandlers();
    }
  }

  complete(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;
    for (const handler of this.completeHandlers) handler();
    this.cleanHandlers();
  }

  on(event: 'next' | 'error' | 'complete', handler: (...args: any[]) => void): void {
    if (this.isCompleted) return;
    if (event === 'next') this.nextHandlers.push(handler as (value: T) => void);
    else if (event === 'error') this.errorHandlers.push(handler as (err: unknown) => void);
    else if (event === 'complete') this.completeHandlers.push(handler as () => void);
  }

  private cleanHandlers(): void {
    this.nextHandlers = [];
    this.errorHandlers = [];
    this.completeHandlers = [];
  }
}
