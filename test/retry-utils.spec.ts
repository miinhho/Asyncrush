import { createRetryWrapper } from "../lib/utils/retry-utils";

jest.useFakeTimers();

describe("createRetryWrapper function", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("middlewares should be chained correctly", (done) => {
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

  test("middlewares should be chained correctly with retries", async () => {
    let attempt = 0;
    const middlewares = [
      (value: number) => {
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

    result.then((res) => {
      expect(res).toBe(4);
    });
  });

  test("middlewares should be chained correctly with promise", async () => {
    const middlewares = [
      async (value: number) => value + 1,
      async (value: number) => value * 2,
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
    const result = applyMiddleware(1) as Promise<number>;

    result.then((res) => {
      expect(res).toBe(4);
    });
  });
});
