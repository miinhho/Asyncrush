import { RushMiddleware } from "../middleware/rush-middleware.types";
import { RushObserver } from "../observer/rush-observer";
import { RushObserveStream } from "../observer/rush-observer.types";
import { RushListenOption } from "./rush-stream.types";
/**
 * Stream that emits values, errors, and completion events
 */
export declare class RushStream<T = any> {
    private producer;
    private sourceObserver;
    private outputObserver;
    private cleanup;
    private isPaused;
    private useBuffer;
    private buffer;
    private maxBufferSize;
    /**
     * @param producer - A function that takes an RushObserver and returns a cleanup function
     */
    constructor(producer: (observer: RushObserver<T>) => () => void | void, options?: {
        useBuffer?: boolean;
        maxBufferSize?: number;
        continueOnError?: boolean;
    });
    /**
     * Pauses the stream, buffering values if resumed
     * @returns The RushStream instance for chaining
     */
    pause(): this;
    /**
     * Resumes the stream, flushing buffered values
     * @returns The RushStream instance for chaining
     */
    resume(): this;
    /**
     * Subscribes an observer to the stream
     * @param observer - Partial observer implementation with event handlers
     * @returns - The RushStream instance for chaining
     */
    listen(observer: RushObserveStream<T>): this;
    use(...args: RushMiddleware<T, T>[] | [RushMiddleware<T, T>[], RushListenOption]): RushStream<T>;
    /**
     * Get the stream's observer instance
     * @returns The RushObserver instance
     */
    getObserver(): RushObserver<T>;
    /**
     * Unsubscribes from the stream and emits specified event
     * @param option - Specific event to emit when unsubscribing
     * @returns {this} - The RushStream instance for chaining
     */
    unlisten(option?: 'destory' | 'complete'): this;
}
