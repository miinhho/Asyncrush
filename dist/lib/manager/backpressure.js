"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackpressureController = exports.DEFAULT_BACKPRESSURE_OPTIONS = exports.BackpressureMode = void 0;
/**
 * Backpressure mode options to control flow
 */
var BackpressureMode;
(function (BackpressureMode) {
    /** Drop events when buffer is full */
    BackpressureMode["DROP"] = "drop";
    /** Notify producer to pause when buffer reaches high watermark */
    BackpressureMode["NOTIFY"] = "notify";
    /** Wait for buffer space by returning a Promise */
    BackpressureMode["WAIT"] = "wait";
})(BackpressureMode || (exports.BackpressureMode = BackpressureMode = {}));
/**
 * Default backpressure options
 */
exports.DEFAULT_BACKPRESSURE_OPTIONS = {
    highWatermark: 100,
    lowWatermark: 20,
    mode: BackpressureMode.NOTIFY,
    waitTimeout: 3000,
};
/**
 * Manages backpressure for streams
 * @template T Type of values in the buffer
 */
class BackpressureController {
    /**
     * Creates a new BackpressureController
     * @param options Configuration options
     */
    constructor(options = {}) {
        /** Buffer of pending items */
        this.buffer = [];
        /** Signal when buffer has space for WAIT mode */
        this.waitResolvers = [];
        /** Flow state */
        this.paused = false;
        /** Registered callbacks for state changes */
        this.listeners = {
            pause: new Set(),
            resume: new Set(),
            drop: new Set(),
        };
        const config = Object.assign(Object.assign({}, exports.DEFAULT_BACKPRESSURE_OPTIONS), options);
        this.highWatermark = config.highWatermark;
        this.lowWatermark = config.lowWatermark;
        this.mode = config.mode;
        this.waitTimeout = config.waitTimeout;
        if (this.lowWatermark >= this.highWatermark) {
            throw new Error('[Asyncrush] lowWatermark must be less than highWatermark');
        }
    }
    /**
     * Checks if the buffer has reached high watermark
     */
    isBackpressured() {
        return this.buffer.length >= this.highWatermark;
    }
    /**
     * Checks if the buffer has drained to low watermark
     */
    isDrained() {
        return this.paused && this.buffer.length <= this.lowWatermark;
    }
    /**
     * Notifies producer to pause
     */
    notifyPause() {
        if (!this.paused) {
            this.paused = true;
            this.listeners.pause.forEach((callback) => {
                try {
                    callback();
                }
                catch (err) {
                    console.error('[Asyncrush] Error in pause listener:', err);
                }
            });
        }
    }
    /**
     * Notifies producer to resume
     */
    notifyResume() {
        if (this.paused) {
            this.paused = false;
            this.listeners.resume.forEach((callback) => {
                try {
                    callback();
                }
                catch (err) {
                    console.error('[Asyncrush] Error in resume listener:', err);
                }
            });
        }
    }
    /**
     * Notifies about dropped values
     * @param value The value that was dropped
     */
    notifyDrop(value) {
        this.listeners.drop.forEach((callback) => {
            try {
                callback(value);
            }
            catch (err) {
                console.error('[Asyncrush] Error in drop listener:', err);
            }
        });
    }
    /**
     * Resolves waiting promises when buffer has space
     */
    resolveWaiters() {
        const count = Math.min(this.waitResolvers.length, this.highWatermark - this.buffer.length);
        for (let i = 0; i < count; i++) {
            const { resolve, timer } = this.waitResolvers.shift();
            if (timer) {
                clearTimeout(timer);
            }
            resolve();
        }
    }
    /**
     * Attempts to add a value to the buffer with backpressure handling
     * @param value The value to add
     * @returns Result indicating if the value was accepted and any wait promise
     */
    push(value) {
        if (this.isDrained())
            this.notifyResume();
        if (this.isBackpressured()) {
            switch (this.mode) {
                case BackpressureMode.DROP: {
                    this.notifyDrop(value);
                    return { accepted: false };
                }
                case BackpressureMode.NOTIFY: {
                    this.notifyPause();
                    this.buffer.push(value);
                    return { accepted: true, value };
                }
                case BackpressureMode.WAIT: {
                    let waitResolve;
                    let waitTimer;
                    const waitPromise = new Promise((resolve, reject) => {
                        waitResolve = resolve;
                        if (this.waitTimeout) {
                            waitTimer = setTimeout(() => {
                                const index = this.waitResolvers.findIndex((r) => r.resolve === waitResolve);
                                if (index >= 0) {
                                    this.waitResolvers.splice(index, 1);
                                }
                                reject(new Error('[Asyncrush] Backpressure wait timeout exceeded'));
                            }, this.waitTimeout);
                        }
                    });
                    this.waitResolvers.push({ resolve: waitResolve, timer: waitTimer });
                    this.notifyPause();
                    return {
                        accepted: false,
                        waitPromise: waitPromise.then(() => {
                            this.buffer.push(value);
                        }),
                    };
                }
            }
        }
        else {
            this.buffer.push(value);
        }
        return { accepted: true, value };
    }
    /**
     * Takes the next value from the buffer
     * @returns The next value or undefined if buffer is empty
     */
    take() {
        const value = this.buffer.shift();
        if (this.waitResolvers.length > 0 && !this.isBackpressured()) {
            this.resolveWaiters();
        }
        if (this.isDrained()) {
            this.notifyResume();
        }
        return value;
    }
    /**
     * Takes multiple values from the buffer
     * @param count Maximum number of items to take
     * @returns Array of taken values
     */
    takeMany(count) {
        const result = [];
        const takeCount = Math.min(count, this.buffer.length);
        for (let i = 0; i < takeCount; i++) {
            result.push(this.buffer.shift());
        }
        if (this.waitResolvers.length > 0 && !this.isBackpressured()) {
            this.resolveWaiters();
        }
        if (this.isDrained()) {
            this.notifyResume();
        }
        return result;
    }
    /**
     * Registers a callback for pause events
     * @param callback Function to call when producer should pause
     * @returns Function to unregister the callback
     */
    onPause(callback) {
        this.listeners.pause.add(callback);
        return () => this.listeners.pause.delete(callback);
    }
    /**
     * Registers a callback for resume events
     * @param callback Function to call when producer can resume
     * @returns Function to unregister the callback
     */
    onResume(callback) {
        this.listeners.resume.add(callback);
        return () => this.listeners.resume.delete(callback);
    }
    /**
     * Registers a callback for drop events
     * @param callback Function to call when a value is dropped
     * @returns Function to unregister the callback
     */
    onDrop(callback) {
        this.listeners.drop.add(callback);
        return () => this.listeners.drop.delete(callback);
    }
    /**
     * Gets the current buffer size
     */
    get size() {
        return this.buffer.length;
    }
    /**
     * Checks if the buffer is empty
     */
    get isEmpty() {
        return this.buffer.length === 0;
    }
    /**
     * Gets the current pause state
     */
    get isPaused() {
        return this.paused;
    }
    /**
     * Changes the backpressure mode
     * @param mode New backpressure mode
     */
    setMode(mode) {
        this.mode = mode;
    }
    /**
     * Updates the watermark levels
     * @param highWatermark New high watermark
     * @param lowWatermark New low watermark
     */
    setWatermarks(highWatermark, lowWatermark) {
        if (lowWatermark >= highWatermark) {
            throw new Error('[Asyncrush] lowWatermark must be less than highWatermark');
        }
        this.highWatermark = highWatermark;
        this.lowWatermark = lowWatermark;
        if (this.buffer.length > highWatermark && !this.paused) {
            this.notifyPause();
        }
        else if (this.buffer.length <= highWatermark && this.paused) {
            this.notifyResume();
        }
    }
    /**
     * Clears the buffer and resets the controller
     */
    clear() {
        this.buffer = [];
        this.waitResolvers.forEach(({ resolve, timer }) => {
            if (timer) {
                clearTimeout(timer);
            }
            resolve();
        });
        this.waitResolvers = [];
        if (this.paused) {
            this.notifyResume();
        }
    }
}
exports.BackpressureController = BackpressureController;
