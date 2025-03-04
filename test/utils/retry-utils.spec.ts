import { createRetryWrapper } from "../../lib/utils/retry-utils";

jest.useFakeTimers();

describe("createRetryWrapper function", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("middleware chain", (done) => {
    const middlewares = [
      (value: number) => value + 1,
      (value: number) => value * 2,
    ];
    const options = {
      retries: 1,
      retryDelay: 0,
      maxRetryDelay: 0,
      jitter: 0,
      delayFn: (attempt: number, baseDelay: number) => baseDelay,
    };
    const errorHandler = (error: unknown) => {
      expect(error).toBeUndefined();
    };

    const { applyMiddleware } = createRetryWrapper(middlewares, options, errorHandler);
    const result = applyMiddleware(1);

    expect(result).toBe(4);
    done();
  });

  test("middleware chained with retries", (done) => {
    let attempt = 0;
    const middlewares = [
      async (value: number) => {
        if (attempt === 0) {
          throw new Error("Error");
        }
        return value + 1;
      },
      (value: number) => value * 2,
    ];
    const options = {
      retries: 1,
      retryDelay: 0,
      maxRetryDelay: 0,
      jitter: 0,
      delayFn: (attempt: number, baseDelay: number) => baseDelay,
    };
    const errorHandler = (error: unknown) => {
      attempt++;
    };

    const { applyMiddleware } = createRetryWrapper(middlewares, options, errorHandler);
    const result = applyMiddleware(1) as Promise<number>;

    jest.advanceTimersByTime(10);
    result.then((res) => {
      expect(res).toBe(4);
    });
    done();
  });

  test("middleware chained with promise", (done) => {
    const middlewares = [
      async (value: number) => new Promise<number>((res) => res(value + 1)),
      async (value: number) => value * 2,
    ];
    const options = {
      retries: 1,
      retryDelay: 1,
      maxRetryDelay: 1,
      jitter: 0,
      delayFn: (attempt: number, baseDelay: number) => baseDelay,
    };
    const errorHandler = (error: unknown) => { };

    const { applyMiddleware } = createRetryWrapper(middlewares, options, errorHandler);
    const result = applyMiddleware(1) as Promise<number>;

    result.then((res) => {
      expect(res).toBe(4);
      done();
    });
  });

  test("middleware with retries & jitter", (done) => {
    let attempt = 0;
    const middlewares = [
      async (value: number) => {
        if (attempt === 0) {
          throw new Error("Error");
        }
        return value + 1;
      },
      (value: number) => value * 2,
    ];
    const options = {
      retries: 1,
      retryDelay: 1,
      maxRetryDelay: 2,
      jitter: 0.1,
      delayFn: (attempt: number, baseDelay: number) => baseDelay,
    };
    const errorHandler = (error: unknown) => {
      attempt++;
    };

    const { applyMiddleware } = createRetryWrapper(middlewares, options, errorHandler);
    const result = applyMiddleware(1) as Promise<number>;

    jest.advanceTimersByTime(10);
    result.then((res) => {
      expect(res).toBe(4);
      expect(attempt).toBe(1);
    });
    done();
  });

  test("middleware promise catching errors in another middleware", (done) => {
    let attempt = 0;
    const middlewares = [
      async (value: number) => {
        return new Promise<number>(
          (res) => res(value)
        ).then((value) => value + 1);
      },
      async (value: number) => {
        if (attempt === 0) {
          throw new Error("Error");
        }
        return value * 2;
      },
    ];
    const options = {
      retries: 1,
      retryDelay: 1,
      maxRetryDelay: 2,
      jitter: 0.1,
      delayFn: (attempt: number, baseDelay: number) => baseDelay,
    };
    const errorHandler = (error: unknown) => {
      attempt++;
    };

    const { applyMiddleware } = createRetryWrapper(middlewares, options, errorHandler);
    const result = applyMiddleware(1) as Promise<number>;

    jest.advanceTimersByTime(10);
    result.then((res) => {
      expect(res).toBe(4);
      expect(attempt).toBe(1);
    });
    done();
  });
});
