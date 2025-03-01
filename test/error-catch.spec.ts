import { RushStream } from "../lib/stream/rush-stream";
import { RushSubscriber } from "../lib/stream/rush-subscriber";

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

  test("handles middleware error", (done) => {
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

  test("handles subscriber error", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    }, { continueOnError: true });

    const errorSpy = jest.fn();

    const sub = new RushSubscriber<number>({ continueOnError: true });
    sub.use((value) => {
      if (value < 2) throw new Error("error");
      else return value;
    });
    sub.onError((error) => {
      errorSpy(error);
    });

    stream
      .subscribe(sub)
      .listen({
      next: (value) => { }
    });

    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
    done();
  });
});
