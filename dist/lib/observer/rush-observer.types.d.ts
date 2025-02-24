/**
 * Interface for the RushObserver
 */
export interface RushObserverImpl<T> {
    /** Emits the next value */
    readonly next: (value: T) => void;
    /** Emits an error */
    readonly error: (err: unknown) => void;
    /** Emits the completion event */
    readonly complete: () => void;
}
/**
 * Partial type for observer's stream options
 */
export type RushObserveStream<T> = Partial<RushObserverImpl<T>>;
