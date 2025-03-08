import { BackpressureMode, RushSubscriber } from "../../lib";

describe('backpressure', () => {
  test('should apply backpressure in NOTIFY mode', () => {
    const subscriber = new RushSubscriber<number>({
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.NOTIFY
      }
    });

    const nextSpy = jest.fn();
    subscriber.onNext(nextSpy);

    const backpressureController = subscriber.getBackpressureController();
    expect(backpressureController).toBeDefined();

    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);

    expect(nextSpy).toHaveBeenCalledTimes(3);
    expect(backpressureController!.isPaused).toBe(true);

    backpressureController!.take();
    backpressureController!.take();

    expect(backpressureController!.isPaused).toBe(false);
  });

  test('should set backpressure mode', () => {
    const subscriber = new RushSubscriber<number>({
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.NOTIFY
      }
    });

    subscriber.setBackpressureMode(BackpressureMode.DROP);
    subscriber.setBackpressureWatermarks(5, 2);

    const controller = subscriber.getBackpressureController();
    expect(controller).toBeDefined();
  });
});
