import { BackpressureController, BackpressureMode } from '../../lib';

describe('cleanup', () => {
  test('should clear buffer and resume flow', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 3,
      lowWatermark: 1,
      mode: BackpressureMode.NOTIFY,
      waitTimeout: 10
    });

    const pauseSpy = jest.fn();
    const resumeSpy = jest.fn();

    controller.onPause(pauseSpy);
    controller.onResume(resumeSpy);

    controller.push(1);
    controller.push(2);
    controller.push(3);
    controller.push(4);

    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(controller.isPaused).toBe(true);

    controller.clear();

    expect(controller.isEmpty).toBe(true);
    expect(resumeSpy).toHaveBeenCalledTimes(1);
    expect(controller.isPaused).toBe(false);
  });

  test('should resolve waiters on clear', async () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.WAIT
    });

    controller.push(1);
    controller.push(2);

    const pushPromise = controller.push(3);
    expect(pushPromise.accepted).toBe(false);

    const waitPromise = pushPromise.waitPromise;

    controller.clear();

    await waitPromise;
    expect(controller.size).toBe(1);
  });
});
