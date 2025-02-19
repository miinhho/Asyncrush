import { EventEmitter } from "node:stream";
import { EmitObserverImpl } from "./emit-observer.interface";

export class EmitObserver<T> extends EventEmitter implements EmitObserverImpl<T> {
  constructor() {
    super();
  }

  next(value: T): void {
    this.emit('next', value);
  }

  error(err: any): void {
    this.emit('error', err);
    this.removeAllListeners();
  }

  complete(): void {
    this.emit('complete');
    this.removeAllListeners();
  }
}
