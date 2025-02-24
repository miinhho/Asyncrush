import { RushObserverImpl } from "./rush-observer.types";
/**
 * Observer that emits values, errors, and completion events with chained handler support
 * @template T - Type of values emitted by the observer
 * @implements {RushObserverImpl}
 */
export declare class RushObserver<T = any> implements RushObserverImpl<T> {
    private options;
    /** Handler for 'next' events, chained for multiple listeners */
    private nextHandler;
    /** Handler for 'error' events, chained for multiple error listeners */
    private errorHandler;
    /** Handler for 'complete' events, chained for multiple completion listeners */
    private completeHandler;
    /** Flag indicating if the observer has completed */
    private isCompleted;
    /**
     * Creates a new RushObserver instance
     * @param options - Configuration options, including error continuation
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
     * Emits an error to all chained 'error' handlers
     * @param err - The error to emit
     */
    error(err: unknown): void;
    /**
     * Signals completion to all chained 'complete' handlers
     */
    complete(): void;
    /**
     * Registers a handler for a specific event type, chaining with existing handlers
     * @param event - Event type ('next', 'error', 'complete')
     * @param handler - Callback function to handle the event
     */
    on(event: 'next' | 'error' | 'complete', handler: (...args: any[]) => void): void;
    /**
     * Destroys the observer, marking it as completed and clearing handlers
     */
    destroy(): void;
    /**
     * Clears all event handlers to free resources
     */
    private cleanHandlers;
}
