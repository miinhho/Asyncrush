import { RushObserver, RushStream } from "../../lib";

jest.useFakeTimers();

describe("Error handling", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("observer error handling", (done) => {
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

  test("observer error catching", (done) => {
    const observer = new RushObserver({ continueOnError: true });
    const errorSpy = jest.fn();

    observer.onNext((value) => {
      throw new Error("error");
    });
    observer.onError(errorSpy);

    observer.next(1);

    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
    done();
  });
});
