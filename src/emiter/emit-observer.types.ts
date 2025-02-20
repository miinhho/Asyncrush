
/**
 * EmitObserver interface
 */
export interface EmitObserverImpl {

  /**
   * Emits the next value
   * @param value
   */
  next: (value: any) => void;

  /**
   * Emits an error
   * @param err
   */
  error: (err: any) => void;

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
export type EmitObserveStream = Partial<EmitObserverImpl>;

/**
 * EmitObserver event list
 */
export type EmitObserveEvent = keyof EmitObserveStream;
