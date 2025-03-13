import { BackpressureController, BackpressureMode } from '../../lib';

describe('event callbacks', () => {
  it('should notify all pause callbacks', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1
    });

    const pauseSpy1 = jest.fn();
    const pauseSpy2 = jest.fn();
    const pauseSpy3 = jest.fn();

    controller.onPause(pauseSpy1);
    controller.onPause(pauseSpy2);
    controller.onPause(pauseSpy3);

    controller.push(1);
    controller.push(2);
    controller.push(3);

    expect(pauseSpy1).toHaveBeenCalledTimes(1);
    expect(pauseSpy2).toHaveBeenCalledTimes(1);
    expect(pauseSpy3).toHaveBeenCalledTimes(1);
  });

  it('should notify all resume callbacks', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1
    });

    const resumeSpy1 = jest.fn();
    const resumeSpy2 = jest.fn();

    controller.onResume(resumeSpy1);
    controller.onResume(resumeSpy2);

    controller.push(1);
    controller.push(2);
    controller.push(3);
    controller.take();
    controller.take();

    expect(resumeSpy1).toHaveBeenCalledTimes(1);
    expect(resumeSpy2).toHaveBeenCalledTimes(1);
  });

  it('should notify all drop callbacks', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.DROP
    });

    const dropSpy1 = jest.fn();
    const dropSpy2 = jest.fn();

    controller.onDrop(dropSpy1);
    controller.onDrop(dropSpy2);

    controller.push(1);
    controller.push(2);
    controller.push(3);

    expect(dropSpy1).toHaveBeenCalledWith(3);
    expect(dropSpy2).toHaveBeenCalledWith(3);
  });

  it('should unregister pause callback', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1
    });

    const pauseSpy = jest.fn();
    const unregister = controller.onPause(pauseSpy);

    controller.push(1);
    controller.push(2);
    controller.push(3);

    expect(pauseSpy).toHaveBeenCalledTimes(1);
    pauseSpy.mockClear();

    unregister();

    controller.clear();
    controller.push(1);
    controller.push(2);
    controller.push(3);
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it('should unregister resume callback', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1
    });

    const resumeSpy = jest.fn();
    const unregister = controller.onResume(resumeSpy);

    controller.push(1);
    controller.push(2);
    controller.push(3);
    controller.take();
    controller.take();

    expect(resumeSpy).toHaveBeenCalledTimes(1);
    resumeSpy.mockClear();

    unregister();

    controller.push(1);
    controller.push(2);
    controller.take();
    controller.take();
    expect(resumeSpy).not.toHaveBeenCalled();
  });

  it('should unregister drop callback', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1,
      mode: BackpressureMode.DROP
    });

    const dropSpy = jest.fn();
    const unregister = controller.onDrop(dropSpy);

    controller.push(1);
    controller.push(2);
    controller.push(3);

    expect(dropSpy).toHaveBeenCalledWith(3);
    dropSpy.mockClear();

    unregister();

    controller.push(4);
    expect(dropSpy).not.toHaveBeenCalled();
  });

  it('should handle errors in event callbacks', () => {
    const controller = new BackpressureController<number>({
      highWatermark: 2,
      lowWatermark: 1
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    controller.onPause(() => {
      throw new Error('Pause error');
    });

    controller.onResume(() => {
      throw new Error('Resume error');
    });

    controller.onDrop(() => {
      throw new Error('Drop error');
    });

    controller.push(1);
    controller.push(2);
    controller.push(3);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Asyncrush] Error in pause listener:',
      expect.any(Error)
    );

    controller.setMode(BackpressureMode.DROP);
    controller.push(3);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Asyncrush] Error in drop listener:',
      expect.any(Error)
    );

    controller.clear();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Asyncrush] Error in resume listener:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
