import { captureRejectionSymbol, EventEmitter } from "node:stream";
import { EmitObserverImpl } from "./emit-observer.types";

/**
 * An observer that can emit values, errors and completion events
 * @extends EventEmitter
 * @implements {EmitObserverImpl}
 */
export class EmitObserver<T = any> extends EventEmitter implements EmitObserverImpl<T> {
  private isCompleted: boolean = false;

  constructor(private options: { continueOnError?: boolean } = {}) {
    super({ captureRejections: true });
  }

  /**
   * Emits the next value if the observer is not completed
   * @param value - The value to emit
   */
  next(value: T): void {
    if (this.isCompleted) return;
    this.emit('next', value);
  }

  /**
   * Emits an error and marks the observer as completed
   * @param err - The error to emit
   */
  error(err: unknown): void {
    if (this.isCompleted) return;
    this.emit('error', err);
    if (!this.options.continueOnError) {
      this.isCompleted = true;
      this.removeAllListeners();
    }
  }

  /**
   * Emits a completion event and cleans up listeners
   */
  complete(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;
    this.emit('complete');
    this.removeAllListeners();
  }

  /**
   * Destroys the observer, cleaning up listeners without emitting events
   */
  destroy(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;
    this.removeAllListeners();
  }

  /**
   * Handles captured rejections
   * @internal Do not call this method directly
   * @param err - The rejection error
   * @param event - The event that triggered the rejection
   * @param args - Additional arguments from the event
   */
  [captureRejectionSymbol](err: unknown, event: string | symbol, ...args: any): void {
    if (this.isCompleted) return;
    this.emit('error', err);
    if (!this.options.continueOnError) {
      this.isCompleted = true;
      this.removeAllListeners();
    }
  }
}
