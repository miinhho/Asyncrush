import { RushObserver, RushStream } from '../../lib';

jest.useFakeTimers();

describe('middleware processing', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test('should apply middleware transformations', async () => {
    const nextSpy = jest.fn();
    let sourceObserver: RushObserver<number>;

    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    });

    stream.use(
      (val) => val * 2,
      (val) => val + 1,
    );

    stream.listen({
      next: nextSpy
    });

    sourceObserver!.next(5);

    expect(nextSpy).toHaveBeenCalledWith(11);
  });

  test('should correctly process values through async middleware chain', async () => {
    const resultSpy = jest.fn();

    let observer: RushObserver<number>;
    const stream = new RushStream<number>((obs) => {
      observer = obs;
    });

    stream.use(
      async (value) => {
        return Promise.resolve().then(() => value * 2);
      },
      async (value) => {
        return (await value) + 1;
      }
    );

    stream.listen({
      next: resultSpy
    });

    observer!.next(5);

    await jest.runAllTimersAsync();
    expect(resultSpy).toHaveBeenCalledTimes(1);
    expect(resultSpy).toHaveBeenCalledWith(11);

    resultSpy.mockClear();
    observer!.next(10);

    await jest.runAllTimersAsync();

    expect(resultSpy).toHaveBeenCalledWith(21);
  });

  test('should handle errors in middleware', () => {
    const nextSpy = jest.fn();
    const errorSpy = jest.fn();
    const testError = new Error('Middleware error');
    let sourceObserver: RushObserver<number>;

    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    });

    stream.use(
      () => { throw testError; }
    );

    stream.listen({
      next: nextSpy,
      error: errorSpy
    });

    sourceObserver!.next(5);

    expect(nextSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(testError);
  });

  test('should support retry options for middleware', async () => {
    let attempts = 0;
    const middleware = jest.fn().mockImplementation((val: number) => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return val * 2;
    });

    const errorSpy = jest.fn();
    const nextSpy = jest.fn();
    let sourceObserver: RushObserver<number>;

    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    });

    stream.use(
      [middleware],
      {
        retries: 3,
        retryDelay: 10,
        errorHandler: errorSpy
      }
    );

    stream.listen({
      next: nextSpy
    });

    sourceObserver!.next(5);

    expect(middleware).toHaveBeenCalledTimes(1);
    expect(nextSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10);
    expect(middleware).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(20);
    expect(middleware).toHaveBeenCalledTimes(3);
    expect(nextSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
