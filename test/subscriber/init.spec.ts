import { BackpressureMode, RushSubscriber } from "../../lib";

describe('initialization', () => {
  it('should create with default options', () => {
    const subscriber = new RushSubscriber();
    expect(subscriber.isDestroyed()).toBe(false);
    expect(subscriber.stream).toBeUndefined();
  });

  it('should create with backpressure options', () => {
    const subscriber = new RushSubscriber({
      backpressure: {
        highWatermark: 10,
        lowWatermark: 5,
        mode: BackpressureMode.NOTIFY
      }
    });

    const controller = subscriber.getBackpressureController();
    expect(controller).toBeDefined();
  });
});
