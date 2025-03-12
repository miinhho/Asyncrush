import { BackpressureMode, RushSubscriber } from "../../lib";

describe('backpressure', () => {
  test('should call onPause callback when buffer fills', () => {
    const onPauseSpy = jest.fn();

    const debugHook = {
      onEmit: jest.fn()
    };

    const subscriber = new RushSubscriber<number>({
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.NOTIFY
      },
      debugHook
    });

    const controller = subscriber.getBackpressureController();
    if (controller) {
      controller.onPause(onPauseSpy);
    }

    subscriber.pause();
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);

    expect(onPauseSpy).toHaveBeenCalled();
    expect(debugHook.onEmit).toHaveBeenCalledWith({ type: 'backpressure:pause' });
  });

  test('should call onResume callback when buffer drains', () => {
    const onPauseSpy = jest.fn();
    const onResumeSpy = jest.fn();
    const debugHook = {
      onEmit: jest.fn()
    };

    const subscriber = new RushSubscriber<number>({
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.NOTIFY
      },
      debugHook
    });

    const controller = subscriber.getBackpressureController();
    if (controller) {
      controller.onPause(onPauseSpy);
      controller.onResume(onResumeSpy);
    }

    subscriber.pause();
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    expect(onPauseSpy).toHaveBeenCalled();

    controller?.take();
    controller?.take();

    expect(onResumeSpy).toHaveBeenCalled();
    expect(debugHook.onEmit).toHaveBeenCalledWith({ type: 'backpressure:resume' });
  });

  test('should call onDrop callback in DROP mode', () => {
    const onDropSpy = jest.fn();
    const debugHook = {
      onEmit: jest.fn()
    };

    const subscriber = new RushSubscriber<number>({
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.DROP
      },
      debugHook
    });

    const controller = subscriber.getBackpressureController();
    if (controller) {
      controller.onDrop(onDropSpy);
    }

    subscriber.pause();
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);

    expect(controller?.size).toBe(2);
    expect(onDropSpy).toHaveBeenCalledWith(3);
    expect(debugHook.onEmit).toHaveBeenCalledWith({ type: 'backpressure:drop', value: 3 });
  });

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

    subscriber.pause();
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);

    expect(nextSpy).not.toHaveBeenCalled();
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

  test('should drop events in DROP mode when buffer is full', () => {
    const subscriber = new RushSubscriber<number>({
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.DROP
      }
    });

    const nextSpy = jest.fn();
    subscriber.onNext(nextSpy);

    subscriber.pause();
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    expect(subscriber.getBackpressureController()?.size).toBe(2);

    subscriber.resume();
    expect(nextSpy).toHaveBeenCalledTimes(2);
  });

  test('should buffer events in WAIT mode', () => {
    const subscriber = new RushSubscriber<number>({
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.WAIT
      }
    });

    const nextSpy = jest.fn();
    subscriber.onNext(nextSpy);

    subscriber.pause();
    subscriber.next(1);
    subscriber.next(2);
    subscriber.next(3);
    expect(subscriber.getBackpressureController()?.size).toBe(2);

    subscriber.resume();
    expect(nextSpy).toHaveBeenCalledTimes(2);
  });
});
