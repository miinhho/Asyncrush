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
});
