"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriber = createSubscriber;
const core_1 = require("../core");
const manager_1 = require("../manager");
/**
 * Creates an optimized subscriber with performance enhancements
 * @param options Configuration options
 * @returns An optimized RushSubscriber instance
 */
function createSubscriber(options = {}) {
    const enhancedOptions = Object.assign(Object.assign({}, (options.backpressure !== null && {
        backpressure: manager_1.DEFAULT_BACKPRESSURE_OPTIONS,
    })), { continueOnError: options.continueOnError, debugHook: options.debugHook });
    return new core_1.RushSubscriber(enhancedOptions);
}
