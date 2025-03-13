"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStream = createStream;
const core_1 = require("../core");
const manager_1 = require("../manager");
/**
 * Creates an optimized stream with performance enhancements
 * @param producer Function that emits events
 * @param options Configuration options
 * @returns An optimized RushStream instance
 */
function createStream(producer, options = {}) {
    const enhancedOptions = Object.assign(Object.assign({}, (options.backpressure !== null && {
        backpressure: manager_1.DEFAULT_BACKPRESSURE_OPTIONS,
    })), { continueOnError: options.continueOnError, debugHook: options.debugHook, eventTargets: options.eventTargets });
    return new core_1.RushStream(producer, enhancedOptions);
}
