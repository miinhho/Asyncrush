import { BackpressureController, BackpressureMode } from '../../lib';

describe('configuration changes', () => {
  it('should update watermark levels', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 10,
      lowWatermark: 5
    });

    const pauseSpy = jest.fn();

    controller.onPause(pauseSpy);

    for (let i = 0; i < 5; i++) {
      controller.push(i);
    }
    expect(pauseSpy).not.toHaveBeenCalled();

    controller.setWatermarks(4, 2);
    expect(pauseSpy).toHaveBeenCalled();
  });

  it('should change backpressure mode', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.NOTIFY
    });

    controller.push(1);
    controller.push(2);

    controller.setMode(BackpressureMode.DROP);

    const dropSpy = jest.fn();
    controller.onDrop(dropSpy);

    const result = controller.push(3);
    expect(result.accepted).toBe(false);
    expect(dropSpy).toHaveBeenCalledWith(3);
  });

  it('should throw when updating with invalid watermarks', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 10,
      lowWatermark: 5
    });

    expect(() => {
      controller.setWatermarks(5, 6);
    }).toThrow('[Asyncrush] lowWatermark must be less than highWatermark');

    expect(() => {
      controller.setWatermarks(5, 5);
    }).toThrow('[Asyncrush] lowWatermark must be less than highWatermark');

    expect(() => {
      controller.setWatermarks(8, 4);
    }).not.toThrow();
  });
});
