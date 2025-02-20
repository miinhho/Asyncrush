import { captureRejectionSymbol, EventEmitter } from "node:stream";
import { EmitObserverImpl } from "./emit-observer.interface";

/**
 * An observer that can emit values, errors and completion events
 * @extends EventEmitter
 * @implements {EmitObserverImpl<T>}
 */
export class EmitObserver<T> extends EventEmitter implements EmitObserverImpl<T> {
  constructor() {
    super({ captureRejections: true });
  }

  /**
   * Emits the next value
   * @param {T} value
   */
  next(value: T): void {
    this.emit('next', value);
  }

  /**
   * Emits an error
   * @param {any} err
   */
  error(err: any): void {
    this.emit('error', err);
    this.removeAllListeners();
  }

  /**
   * Emits a completion event
   */
  complete(): void {
    this.emit('complete');
    this.removeAllListeners();
  }

  /**
   * Handles captured rejections
   * @param {any} err
   * @param {string | symbol} event
   * @param {...any} args
   */
  [captureRejectionSymbol](err: any, event: string | symbol, ...args: any): void {
    this.emit('error', err);
    this.removeAllListeners();
  }
}
