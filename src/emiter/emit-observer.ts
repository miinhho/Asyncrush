import { captureRejectionSymbol, EventEmitter } from "node:stream";
import { EmitObserverImpl } from "./emit-observer.types";

/**
 * An observer that can emit values, errors and completion events
 * @extends EventEmitter
 * @implements {EmitObserverImpl}
 */
export class EmitObserver extends EventEmitter implements EmitObserverImpl {
  constructor() {
    super({ captureRejections: true });
  }

  /**
   * Emits the next value
   * @param value
   */
  next(value: any): void {
    this.emit('next', value);
  }

  /**
   * Emits an error
   * @param err
   */
  error(err: any): void {
    this.emit('error', err);
  }

  /**
   * Emits a completion event
   */
  complete(): void {
    this.emit('complete');
    this.removeAllListeners();
  }

  /**
   * Cleans up listeners
   */
  destroy(): void {
    this.removeAllListeners();
  }

  /**
   * Handles captured rejections
   * Do not call this method directly
   * @param err
   * @param event
   * @param args
   */
  [captureRejectionSymbol](err: any, event: string | symbol, ...args: any): void {
    this.emit('error', err);
    this.removeAllListeners();
  }
}
