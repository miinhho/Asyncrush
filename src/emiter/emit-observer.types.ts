
/**
 * EmitObserver interface
 */
export interface EmitObserverImpl<T> {

  /**
   * Emits the next value
   * @param value
   */
  next: (value: T) => void;

  /**
   * Emits an error
   * @param err
   */
  error: (err: unknown) => void;

  /**
   * Emits the completion event
   */
  complete: () => void;

  /**
   * Cleans up listeners
   */
  destroy: () => void;
}

/**
 * Partial EmitObserver for stream options
 */
export type EmitObserveStream<T> = Partial<EmitObserverImpl<T>>;

/**
 * EmitObserver event list
 */
export type EmitObserveEvent<T> = keyof EmitObserveStream<T>;
