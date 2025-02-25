"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RushBuffer = void 0;
/**
 * A buffer to store events when paused
 * @template T - Type of the buffers
 */
class RushBuffer {
    /**
     * Creates a new RushBuffer instance
     * @param maxsize - Maximum size of the buffer
     */
    constructor(size = 0) {
        /** Buffer to store events when paused */
        this.buffer = null;
        /** Flag to pause the stream */
        this.isPaused = false;
        this.size = size;
        if (size > 0) {
            this.buffer = [];
        }
    }
    /** Pauses the stream, buffering events if enabled */
    pause() {
        this.isPaused = true;
        return this;
    }
    /**
     * Resumes the stream, flushing buffered events
     * @param processFn - Function to process buffered events
    */
    resume(processFn) {
        var _a;
        this.isPaused = false;
        if (this.buffer) {
            while (this.buffer.length > 0 && !this.isPaused) {
                processFn((_a = this.buffer) === null || _a === void 0 ? void 0 : _a.shift());
            }
        }
        return this;
    }
    /**
     * Add a value to the buffer
     * @param value
     */
    add(value) {
        if (this.buffer) {
            if (this.buffer.length >= this.maxSize) {
                this.buffer.shift();
            }
            this.buffer.push(value);
        }
        return this;
    }
    /** Get the stream is paused or not */
    get paused() {
        return this.isPaused;
    }
    /** Get the maximum buffer size */
    set maxSize(size) {
        this.size = size;
    }
    /** Set the maximum buffer size */
    get maxSize() {
        return this.size;
    }
}
exports.RushBuffer = RushBuffer;
//# sourceMappingURL=rush-buffer.js.map