import { RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe('middleware processing', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test('should apply middleware transformations', () => {
    const subscriber = new RushSubscriber<number>();
    const nextSpy = jest.fn();

    subscriber.use(
      (val) => val * 2,
      (val) => val + 1,
      nextSpy
    );

    subscriber.next(5);

    expect(nextSpy).toHaveBeenCalledWith(11);
  });

  test('should handle errors in middleware', () => {
    const subscriber = new RushSubscriber<number>();
    const nextSpy = jest.fn();
    const errorSpy = jest.fn();
    const testError = new Error('Middleware error');

    subscriber.onNext(nextSpy);
    subscriber.onError(errorSpy);

    subscriber.use(
      () => { throw testError; }
    );

    subscriber.next(5);

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

    const subscriber = new RushSubscriber<number>();
    subscriber.onNext(nextSpy);

    subscriber.use(
      [middleware],
      {
        retries: 3,
        retryDelay: 1,
        errorHandler: errorSpy
      }
    );

    subscriber.next(5);

    expect(middleware).toHaveBeenCalledTimes(1);
    expect(nextSpy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    jest.advanceTimersByTime(2);

    expect(middleware).toHaveBeenCalledTimes(3);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('should not apply middleware if destroyed', (done) => {
    const subscriber = new RushSubscriber<number>();
    const middlewareSpy = jest.fn();

    subscriber.use(middlewareSpy);

    subscriber.destroy();
    subscriber.next(5);

    expect(middlewareSpy).not.toHaveBeenCalled();
    done();
  });
});
