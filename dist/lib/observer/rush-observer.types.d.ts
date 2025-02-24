/**
 * RushObserver interface
 */
export interface RushObserverImpl<T> {
    /**
     * Emits the next value
     * @param value
     */
    readonly next: (value: T) => void;
    /**
     * Emits an error
     * @param err
     */
    readonly error: (err: unknown) => void;
    /**
     * Emits the completion event
     */
    readonly complete: () => void;
}
/**
 * Partial RushObserver for stream options
 */
export type RushObserveStream<T> = Partial<RushObserverImpl<T>>;
