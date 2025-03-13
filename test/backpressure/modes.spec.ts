import { BackpressureController, BackpressureMode } from '../../lib';

describe('backpressure modes', () => {
  it('should return correct push result for NOTIFY mode', () => {
    const notifyController = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.NOTIFY
    });

    const notifyResult1 = notifyController.push(1);
    expect(notifyResult1.accepted).toBe(true);
    expect(notifyResult1.value).toBe(1);

    notifyController.push(2);
    const notifyResult3 = notifyController.push(3);
    expect(notifyResult3.accepted).toBe(true);
    expect(notifyResult3.value).toBe(3);
  });

  it('should return correct push result for DROP mode', () => {
    const dropController = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.DROP
    });

    const dropResult1 = dropController.push(1);
    expect(dropResult1.accepted).toBe(true);
    expect(dropResult1.value).toBe(1);

    dropController.push(2);
    const dropResult3 = dropController.push(3);
    expect(dropResult3.accepted).toBe(false);
    expect(dropResult3.value).toBeUndefined();
  });

  it('should return correct push result for WAIT mode', () => {
    const waitController = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.WAIT
    });

    const waitResult1 = waitController.push(1);
    expect(waitResult1.accepted).toBe(true);
    expect(waitResult1.value).toBe(1);

    waitController.push(2);
    const waitResult3 = waitController.push(3);
    expect(waitResult3.accepted).toBe(false);
    expect(waitResult3.waitPromise).toBeDefined();
    expect(waitResult3.value).toBeUndefined();
  });

  it('NOTIFY mode should update pause state', () => {
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

  it('DROP mode should drop values when buffer is full', () => {
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

  it('WAIT mode should return waitPromise when buffer is full', async () => {
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

  it('WAIT mode should timeout if buffer remains full', async () => {
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

    await expect(result.waitPromise).rejects.toThrow('[Asyncrush] Backpressure wait timeout exceeded');
  });

  it('should resolve waiters in correct order', async () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.WAIT
    });

    controller.push(1);
    controller.push(2);

    const waitPromise1 = controller.push(3).waitPromise;
    const waitPromise2 = controller.push(4).waitPromise;
    const waitPromise3 = controller.push(5).waitPromise;

    controller.take();

    await waitPromise1;
    expect(controller.size).toBe(2);

    controller.take();
    await waitPromise2;
    expect(controller.size).toBe(2);

    controller.take();
    await waitPromise3;
    expect(controller.size).toBe(2);
    expect(controller.take()).toBe(4);
    expect(controller.take()).toBe(5);
  });

  it('should handle multiple resolves with takeMany', async () => {
    const controller = new BackpressureController<number>({
      highWatermark: 3,
      lowWatermark: 1,
      mode: BackpressureMode.WAIT
    });

    controller.push(1);
    controller.push(2);
    controller.push(3);

    const waitPromise1 = controller.push(4).waitPromise;
    const waitPromise2 = controller.push(5).waitPromise;
    controller.takeMany(3);

    await Promise.all([waitPromise1, waitPromise2]);
    expect(controller.size).toBe(2);
    expect(controller.take()).toBe(4);
    expect(controller.take()).toBe(5);
  });

  it('should handle immediate clear while waiting', async () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.WAIT
    });

    controller.push(1);
    controller.push(2);

    const pushResult = controller.push(3);
    const waitPromise = pushResult.waitPromise;
    controller.clear();

    await waitPromise;
    expect(controller.size).toBe(1);
    expect(controller.take()).toBe(3);
  });
});
