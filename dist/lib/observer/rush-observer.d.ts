import { RushObserverImpl } from '../';
/**
 * Observer that emits values, errors, and completion events with handler support
 * @template T - Type of values emitted by the observer
 * @implements {RushObserverImpl}
 */
export declare class RushObserver<T = any> implements RushObserverImpl<T> {
    /** Handler for 'next' events, chained for multiple listeners */
    protected nextHandler?: (value: T) => void;
    /** Handler for 'error' events */
    protected errorHandler?: (err: unknown) => void;
    /** Handler for 'complete' events */
    protected completeHandler?: () => void;
    /** Flag to enable error continuation */
    protected continueOnError: boolean;
    /**
     * Creates a new RushObserver instance
     * @param options - Whether to continue on error
     */
    constructor(options?: {
        continueOnError?: boolean;
    });
    /** Emits a value to all chained 'next' handlers */
    next(value: T): void;
    /** Emits an error to 'error' handlers */
    error(err: unknown): void;
    /** Signals completion to 'complete' handlers */
    complete(): void;
    /**
     * Adds a handlers for 'next' events, chaining with existing handlers
     * @param handlers - The handlers to add
     */
    onNext(handler: (value: T) => void): void;
    /**
     * Adds a handler for 'error' events
     * @param handler - The handler to add
     */
    onError(handler: (err: unknown) => void): void;
    /**
     * Adds a handler for 'complete' events
     * @param handler - The handler to add
     */
    onComplete(handler: () => void): void;
    /** Destroys the observer, and clearing handlers */
    destroy(): void;
    /** Clears all event handlers to free resources */
    private cleanHandlers;
}
