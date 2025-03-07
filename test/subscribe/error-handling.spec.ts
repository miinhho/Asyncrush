import { RushStream, RushSubscriber } from "../../dist/lib";

jest.useFakeTimers();

describe("RushSubscriber Error handling", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("handle subscriber error", (done) => {
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
