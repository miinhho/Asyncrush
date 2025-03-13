import { RushObserver, RushStream } from '../../lib';

describe('initialization', () => {
  it('should create with default options', () => {
    const producer = jest.fn();
    const stream = new RushStream(producer);

    expect(stream.subscribers.size).toBe(0);
  });

  it('should execute producer function when listened to', () => {
    const producer = jest.fn();
    const stream = new RushStream(producer);

    stream.listen({});

    expect(producer).toHaveBeenCalledTimes(1);
    expect(producer).toHaveBeenCalledWith(expect.any(RushObserver));
  });

  it('should store cleanup function from producer', () => {
    const cleanup = jest.fn();
    const producer = jest.fn().mockReturnValue(cleanup);
    const stream = new RushStream(producer);

    stream.listen({});
    stream.unlisten();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
