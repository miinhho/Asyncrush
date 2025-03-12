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
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const enhancedOptions = Object.assign(Object.assign({}, (options.backpressure !== null && {
        backpressure: {
            highWatermark: (_b = (_a = options.backpressure) === null || _a === void 0 ? void 0 : _a.highWatermark) !== null && _b !== void 0 ? _b : 50,
            lowWatermark: (_d = (_c = options.backpressure) === null || _c === void 0 ? void 0 : _c.lowWatermark) !== null && _d !== void 0 ? _d : 10,
            mode: (_f = (_e = options.backpressure) === null || _e === void 0 ? void 0 : _e.mode) !== null && _f !== void 0 ? _f : manager_1.BackpressureMode.WAIT,
            waitTimeout: (_h = (_g = options.backpressure) === null || _g === void 0 ? void 0 : _g.waitTimeout) !== null && _h !== void 0 ? _h : 3000,
        },
    })), { continueOnError: options.continueOnError, debugHook: options.debugHook });
    return new core_1.RushSubscriber(enhancedOptions);
}
