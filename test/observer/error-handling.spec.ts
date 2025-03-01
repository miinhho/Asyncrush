import { RushStream } from "../../lib/stream/rush-stream";

jest.useFakeTimers();

describe("Error handling", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("handles observer error", (done) => {
    const stream = new RushStream((observer) => {
      observer.next(1);
    }, { continueOnError: true });

    const errorSpy = jest.fn();
    stream.listen({
      next: (value) => {
        throw new Error("error");
      },
      error: errorSpy
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
    done();
  });
});
