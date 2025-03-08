import { BackpressureController } from '../../lib';

describe('initialization', () => {
    test('should create with default options', () => {
      const controller = new BackpressureController();
      expect(controller.size).toBe(0);
      expect(controller.isEmpty).toBe(true);
      expect(controller.isPaused).toBe(false);
    });

    test('should throw error if lowWatermark >= highWatermark', () => {
      expect(() => {
        new BackpressureController({ highWatermark: 100, lowWatermark: 100 });
      }).toThrow('lowWatermark must be less than highWatermark');
    });
  });
