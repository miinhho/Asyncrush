import { BackpressureMode, RushStream, setBackpressure } from '../../lib';

describe('setBackpressure', () => {
  let mockStream: RushStream<any>;
  let mockController: any;

  beforeEach(() => {
    mockController = {
      setMode: jest.fn(),
      setWatermarks: jest.fn()
    };

    mockStream = {
      listen: jest.fn(),
      getBackpressureController: () => mockController
    } as unknown as RushStream<any>;
  });

  it('should set mode when provided', () => {
    const result = setBackpressure(mockStream, {
      mode: BackpressureMode.DROP
    });

    expect(mockController.setMode).toHaveBeenCalledWith(BackpressureMode.DROP);
    expect(result).toBe(mockStream);
  });

  it('should set watermarks when both high and low are provided', () => {
    const highWatermark = 100;
    const lowWatermark = 50;

    const result = setBackpressure(mockStream, {
      highWatermark,
      lowWatermark
    });

    expect(mockController.setWatermarks).toHaveBeenCalledWith(highWatermark, lowWatermark);
    expect(result).toBe(mockStream);
  });

  it('should set both mode and watermarks when all are provided', () => {
    const highWatermark = 200;
    const lowWatermark = 100;
    const mode = BackpressureMode.NOTIFY;

    const result = setBackpressure(mockStream, {
      highWatermark,
      lowWatermark,
      mode
    });

    expect(mockController.setMode).toHaveBeenCalledWith(mode);
    expect(mockController.setWatermarks).toHaveBeenCalledWith(highWatermark, lowWatermark);
    expect(result).toBe(mockStream);
  });

  it('should not call setWatermarks when only highWatermark is provided', () => {
    setBackpressure(mockStream, { highWatermark: 100 });
    expect(mockController.setWatermarks).not.toHaveBeenCalled();
  });

  it('should not call setWatermarks when only lowWatermark is provided', () => {
    setBackpressure(mockStream, { lowWatermark: 50 });
    expect(mockController.setWatermarks).not.toHaveBeenCalled();
  });

  it('should handle streams without backpressure controller', () => {
    const streamWithoutController = {
      listen: jest.fn(),
      getBackpressureController: undefined
    } as unknown as RushStream<any>;

    const result = setBackpressure(streamWithoutController, {
      mode: BackpressureMode.DROP,
      highWatermark: 100,
      lowWatermark: 50
    });

    expect(result).toBe(streamWithoutController);
  });
});
