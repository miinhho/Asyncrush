import { RushObserverImpl } from '../types';
/**
 * Optimized observer that emits values, errors, and completion events with handler support
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
    /** Flag indicating if the observer is active */
    protected isActive: boolean;
    /**
     * Creates a new RushObserver instance
     * @param options - Whether to continue on error
     */
    constructor(options?: {
        continueOnError?: boolean;
    });
    /**
     * Emits a value to all chained 'next' handlers
     * @param value - The value to emit
     */
    next(value: T): void;
    /**
     * Emits an error to 'error' handlers
     * @param err - The error to emit
     */
    error(err: unknown): void;
    /**
     * Signals completion to 'complete' handlers
     */
    complete(): void;
    /**
     * Adds a handler for 'next' events, chaining with existing handlers
     * @param handler - The handler to add
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
    /**
     * Destroys the observer, clearing handlers
     */
    destroy(): void;
    /**
     * Checks if the observer is active
     */
    isDestroyed(): boolean;
    /**
     * Clears all event handlers to free resources
     */
    private cleanHandlers;
}
