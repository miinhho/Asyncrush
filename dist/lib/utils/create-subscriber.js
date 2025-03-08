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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    // Apply default optimization settings
    const enhancedOptions = Object.assign(Object.assign(Object.assign({ 
        // Enable object pooling by default
        useObjectPool: (_a = options.useObjectPool) !== null && _a !== void 0 ? _a : true }, (options.useObjectPool !== false && {
        poolConfig: {
            initialSize: (_c = (_b = options.poolConfig) === null || _b === void 0 ? void 0 : _b.initialSize) !== null && _c !== void 0 ? _c : 10,
            maxSize: (_e = (_d = options.poolConfig) === null || _d === void 0 ? void 0 : _d.maxSize) !== null && _e !== void 0 ? _e : 50,
        },
    })), (options.backpressure !== null && {
        backpressure: {
            highWatermark: (_g = (_f = options.backpressure) === null || _f === void 0 ? void 0 : _f.highWatermark) !== null && _g !== void 0 ? _g : 500,
            lowWatermark: (_j = (_h = options.backpressure) === null || _h === void 0 ? void 0 : _h.lowWatermark) !== null && _j !== void 0 ? _j : 100,
            mode: (_l = (_k = options.backpressure) === null || _k === void 0 ? void 0 : _k.mode) !== null && _l !== void 0 ? _l : manager_1.BackpressureMode.WAIT,
            waitTimeout: (_o = (_m = options.backpressure) === null || _m === void 0 ? void 0 : _m.waitTimeout) !== null && _o !== void 0 ? _o : 30000,
        },
    })), { 
        // Pass through other options
        continueOnError: options.continueOnError, maxBufferSize: options.maxBufferSize, debugHook: options.debugHook });
    return new core_1.RushSubscriber(enhancedOptions);
}
