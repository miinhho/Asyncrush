import { BackpressureController } from '../../lib';

describe('buffers', () => {
  let controller: BackpressureController<number>;

  beforeEach(() => {
    controller = new BackpressureController<number>({
      highWatermark: 10,
      lowWatermark: 5
    });
  });

  test('should add and remove items from buffer', () => {
    controller.push(1);
    controller.push(2);
    controller.push(3);

    expect(controller.size).toBe(3);
    expect(controller.isEmpty).toBe(false);

    const item1 = controller.take();
    expect(item1).toBe(1);
    expect(controller.size).toBe(2);

    const items = controller.takeMany(2);
    expect(items).toEqual([2, 3]);
    expect(controller.isEmpty).toBe(true);
  });

  test('takeMany should not take more than available', () => {
    controller.push(1);
    controller.push(2);

    const items = controller.takeMany(5);
    expect(items).toEqual([1, 2]);
    expect(controller.isEmpty).toBe(true);
  });

  test('take should return undefined when buffer is empty', () => {
    expect(controller.take()).toBeUndefined();
  });

  test('should correctly handle interleaved push and take operations', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 3,
      lowWatermark: 1
    });

    const pauseSpy = jest.fn();
    const resumeSpy = jest.fn();

    controller.onPause(pauseSpy);
    controller.onResume(resumeSpy);

    controller.push(1);
    controller.push(2);
    controller.push(3);
    expect(controller.size).toBe(3);

    controller.push(4);
    expect(pauseSpy).toHaveBeenCalledTimes(1);

    controller.take();
    expect(controller.size).toBe(3);
    expect(resumeSpy).not.toHaveBeenCalled();

    controller.take();
    controller.take();
    expect(controller.size).toBe(1);
    expect(resumeSpy).toHaveBeenCalledTimes(1);

    controller.push(5);
    controller.push(6);
    controller.push(7);
    expect(pauseSpy).toHaveBeenCalledTimes(2);

    expect(controller.isPaused).toBe(true);
    expect(controller.size).toBe(4);
  });
});
