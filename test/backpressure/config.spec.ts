import { BackpressureController, BackpressureMode } from '../../lib';

describe('configuration changes', () => {
  test('should update watermark levels', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 10,
      lowWatermark: 5
    });

    const pauseSpy = jest.fn();
    const resumeSpy = jest.fn();

    controller.onPause(pauseSpy);
    controller.onResume(resumeSpy);

    for (let i = 0; i < 5; i++) {
      controller.push(i);
    }

    expect(pauseSpy).not.toHaveBeenCalled();

    controller.setWatermarks(5, 2);

    expect(pauseSpy).toHaveBeenCalledTimes(1);

    controller.take();
    controller.take();
    controller.take();

    expect(resumeSpy).toHaveBeenCalledTimes(1);
  });

  test('should change backpressure mode', () => {
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
});
