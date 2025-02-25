"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushEventProcessor = void 0;
/**
 * Processor that controls the emission of values with debounce or throttle
 * @template T - The type of values processed
 */
class RushEventProcessor {
    /**
     * Creates a new RushEventProcessor instance
     * @param emitFn - Function to emit the processed value
     */
    constructor(emitFn) {
        this.emitFn = emitFn;
        /** Debounce time in milliseconds */
        this.debounceMs = null;
        /** Timeout for debounce control */
        this.debounceTimeout = null;
        /** Last value for debounce */
        this.lastValue = null;
        /** Throttle time in milliseconds */
        this.throttleMs = null;
        /** Timeout for throttle control */
        this.throttleTimeout = null;
    }
    /** Set the debounce time in milliseconds  */
    setDebounce(ms) {
        this.debounceMs = ms;
        return this;
    }
    /** Set the throttle time in milliseconds  */
    setThrottle(ms) {
        this.throttleMs = ms;
        return this;
    }
    /**
     * Processes an event with debounce or throttle control
     * @param value - Value to process
     */
    process(value) {
        if (this.debounceMs !== null) {
            this.lastValue = value;
            if (this.debounceTimeout)
                clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                if (this.lastValue !== null) {
                    this.emitFn(this.lastValue);
                    this.lastValue = null;
                }
            }, this.debounceMs);
        }
        else if (this.throttleMs !== null) {
            if (!this.throttleTimeout) {
                this.emitFn(value);
                this.throttleTimeout = setTimeout(() => {
                    this.throttleTimeout = null;
                }, this.throttleMs);
            }
        }
        else {
            this.emitFn(value);
        }
    }
}
exports.RushEventProcessor = RushEventProcessor;
//# sourceMappingURL=rush-event.js.map