
/**
 * EmitObserver interface
 */
export interface EmitObserverImpl<T> {

  /**
   * Emits the next value
   * @param {T} value
   */
  next: (value: T) => void;

  /**
   * Emits an error
   * @param {any} err
   */
  error: (err: any) => void;

  /**
   * Emits the completion event
   */
  complete: () => void;
}
