import { BackpressureController, BackpressureMode } from '../../lib';

describe('event callbacks', () => {
  test('should handle errors in event callbacks', () => {
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
