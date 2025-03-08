import { BackpressureMode, RushObserver, RushStream } from '../../lib';

jest.useFakeTimers();

describe('backpressure', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test('should apply backpressure in NOTIFY mode', () => {
    const nextSpy = jest.fn();

    const stream = new RushStream<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
    }, {
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.NOTIFY
      }
    });

    stream.listen({
      next: nextSpy
    });

    const backpressureController = stream.getBackpressureController();
    expect(backpressureController).toBeDefined();

    expect(nextSpy).toHaveBeenCalledTimes(3);
    expect(backpressureController!.isPaused).toBe(true);

    backpressureController!.take();
    backpressureController!.take();

    expect(backpressureController!.isPaused).toBe(false);
  });

  test('should apply backpressure in DROP mode', () => {
    const nextSpy = jest.fn();

    const stream = new RushStream<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
    }, {
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.DROP
      }
    });

    stream.listen({
      next: nextSpy
    });

    const backpressureController = stream.getBackpressureController();

    expect(nextSpy).toHaveBeenCalledTimes(2);
    expect(backpressureController!.size).toBe(2);

    stream.setBackpressureMode(BackpressureMode.NOTIFY);
    stream.setBackpressureWatermarks(3, 1);
  });

  test('should apply backpressure in WAIT mode', async () => {
    const nextSpy = jest.fn();
    let sourceObserver: RushObserver<number>;

    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    }, {
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.WAIT,
        waitTimeout: 1000
      }
    });

    stream.listen({
      next: nextSpy
    });

    const backpressureController = stream.getBackpressureController();

    sourceObserver!.next(1);
    sourceObserver!.next(2);

    sourceObserver!.next(3);
    expect(nextSpy).toHaveBeenCalledTimes(2);

    backpressureController!.take();
    expect(backpressureController!.size).toBe(1);
    expect(nextSpy).toHaveBeenCalledTimes(2);

    backpressureController!.take();
    expect(nextSpy).toHaveBeenCalledTimes(2);
  });
});
