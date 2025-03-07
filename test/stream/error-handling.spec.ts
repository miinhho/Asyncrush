import { RushStream } from "../../dist/lib";

jest.useFakeTimers();

describe("RushStream Error handling", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("handle middleware error", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    }, { continueOnError: true });

    const errorSpy = jest.fn();
    stream
      .use((value) => {
        if (value < 2) throw new Error("error");
        else return value;
      })
      .listen({
      next: (value) => { },
      error: errorSpy
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
    done();
  });
});
