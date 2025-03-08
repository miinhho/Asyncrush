"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBackpressure = setBackpressure;
/**
 * Sets backpressure configuration directly on a stream
 * @param stream Stream to configure
 * @param config Backpressure configuration
 * @returns The configured stream
 */
function setBackpressure(stream, config) {
    var _a, _b;
    // Access internal backpressure controller if available
    const controller = (_b = (_a = stream).getBackpressureController) === null || _b === void 0 ? void 0 : _b.call(_a);
    if (controller) {
        if (config.mode !== undefined) {
            controller.setMode(config.mode);
        }
        if (config.highWatermark !== undefined &&
            config.lowWatermark !== undefined) {
            controller.setWatermarks(config.highWatermark, config.lowWatermark);
        }
    }
    return stream;
}
