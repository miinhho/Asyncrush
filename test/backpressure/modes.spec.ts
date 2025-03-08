import { BackpressureController, BackpressureMode } from '../../lib';

describe('backpressure modes', () => {
  test('NOTIFY mode should update pause state', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 3,
      lowWatermark: 1,
      mode: BackpressureMode.NOTIFY
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

    controller.take();
    controller.take();
    controller.take();

    expect(resumeSpy).toHaveBeenCalledTimes(1);
    expect(controller.isPaused).toBe(false);
  });

  test('DROP mode should drop values when buffer is full', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.DROP
    });

    const dropSpy = jest.fn();
    controller.onDrop(dropSpy);

    controller.push(1);
    controller.push(2);
    const result = controller.push(3);

    expect(result.accepted).toBe(false);
    expect(controller.size).toBe(2);
    expect(dropSpy).toHaveBeenCalledWith(3);
  });

  test('WAIT mode should return waitPromise when buffer is full', async () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.WAIT,
      waitTimeout: 50
    });

    controller.push(1);
    controller.push(2);
    const result = controller.push(3);

    expect(result.accepted).toBe(false);
    expect(result.waitPromise).toBeDefined();

    setTimeout(() => controller.take(), 10);

    await result.waitPromise;
    expect(controller.size).toBe(2);
  });

  test('WAIT mode should timeout if buffer remains full', async () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.WAIT,
      waitTimeout: 10
    });

    controller.push(1);
    controller.push(2);
    const result = controller.push(3);

    expect(result.waitPromise).toBeDefined();

    await expect(result.waitPromise).rejects.toThrow('Backpressure wait timeout exceeded');
  });
});
