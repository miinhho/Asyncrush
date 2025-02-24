import { RushObserverImpl } from "./rush-observer.types";
/**
 * An observer that can emit values, errors and completion events
 * @implements {RushObserverImpl}
 */
export declare class RushObserver<T = any> implements RushObserverImpl<T> {
    private options;
    private nextHandler;
    private errorHandler;
    private completeHandler;
    private isCompleted;
    constructor(options?: {
        continueOnError?: boolean;
    });
    next(value: T): void;
    error(err: unknown): void;
    complete(): void;
    on(event: 'next' | 'error' | 'complete', handler: (...args: any[]) => void): void;
    destroy(): void;
    private cleanHandlers;
}
