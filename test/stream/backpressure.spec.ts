import { BackpressureMode, RushObserver, RushStream } from '../../lib';

jest.useFakeTimers();

describe('backpressure', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should trigger pause and resume callbacks', () => {
    const pauseSpy = jest.fn();
    const resumeSpy = jest.fn();
    const nextSpy = jest.fn();

    let sourceObserver: RushObserver<number>;
    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    }, {
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.NOTIFY,
      }
    });

    stream.listen({
      next: nextSpy
    });

    const backpressureController = stream.getBackpressureController();
    expect(backpressureController).toBeDefined();

    backpressureController?.onPause(pauseSpy);
    backpressureController?.onResume(resumeSpy);

    stream.pause();
    sourceObserver!.next(1);
    sourceObserver!.next(2);
    sourceObserver!.next(3);
    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(resumeSpy).not.toHaveBeenCalled();

    backpressureController!.take();
    backpressureController!.take();
    expect(resumeSpy).toHaveBeenCalledTimes(1);
  });

  it('should apply backpressure in NOTIFY mode', () => {
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

    stream.pause();
    stream.listen({
      next: nextSpy
    });

    const backpressureController = stream.getBackpressureController();
    expect(backpressureController).toBeDefined();

    expect(backpressureController!.isPaused).toBe(true);

    backpressureController!.take();
    backpressureController!.take();

    expect(backpressureController!.isPaused).toBe(false);
  });

  it('should apply backpressure in DROP mode', () => {
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

    stream.pause();
    stream.listen({
      next: nextSpy
    });

    const backpressureController = stream.getBackpressureController();

    expect(nextSpy).not.toHaveBeenCalled();
    expect(backpressureController!.size).toBe(2);

    stream.setBackpressureMode(BackpressureMode.NOTIFY);
    stream.setBackpressureWatermarks(3, 1);
  });

  it('should apply backpressure in WAIT mode', async () => {
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

    stream.pause();
    stream.listen({
      next: nextSpy
    });

    const backpressureController = stream.getBackpressureController();

    sourceObserver!.next(1);
    sourceObserver!.next(2);
    sourceObserver!.next(3);
    expect(nextSpy).not.toHaveBeenCalled();

    backpressureController!.take();
    expect(nextSpy).toHaveBeenCalledTimes(1);

    backpressureController!.take();
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle setting backpressure watermarks dynamically', () => {
    let sourceObserver: RushObserver<number>;
    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    }, {
      backpressure: {
        highWatermark: 2,
        lowWatermark: 1,
        mode: BackpressureMode.NOTIFY
      }
    });

    stream.pause();
    stream.listen({});

    const backpressureController = stream.getBackpressureController()!;

    sourceObserver!.next(1);
    sourceObserver!.next(2);
    sourceObserver!.next(3);
    expect(backpressureController.isPaused).toBe(true);

    stream.setBackpressureWatermarks(4, 2);
    expect(backpressureController.isPaused).toBe(false);

    sourceObserver!.next(4);
    sourceObserver!.next(5);
    expect(backpressureController.isPaused).toBe(false);
    expect(backpressureController.size).toBe(0);
  });
});
