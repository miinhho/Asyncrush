import { RushDebugHook, RushStream, RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe("Debugging in RushSubscriber", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("called when a value is emitted", (done) => {
    const debugHook: RushDebugHook<number> = {
      onEmit: (value) => {
        expect(value).toBe(1);
        done();
      }
    };

    const sub = new RushSubscriber<number>({ debugHook });
    sub.onNext((value) => { });

    new RushStream<number>((observer) => {
      observer.next(1);
    }).subscribe(sub).listen({
      next: (value) => { },
      error: (err) => { },
      complete: () => { }
    });
  });

  test("called when a subscriber is added", (done) => {
    const debugHook: RushDebugHook<number> = {
      onSubscribe: (subscriber) => {
        expect(subscriber).toBeInstanceOf(RushSubscriber);
        done();
      }
    };

    const sub = new RushSubscriber<number>({ debugHook });

    new RushStream<number>((observer) => {
      observer.next(1);
    }).subscribe(sub);
  });

  test("called when a subscriber is removed", (done) => {
    const debugHook: RushDebugHook<number> = {
      onUnsubscribe: (subscriber) => {
        expect(subscriber).toBeInstanceOf(RushSubscriber);
        done();
      }
    };

    const sub = new RushSubscriber<number>({ debugHook });

    new RushStream<number>((observer) => {
      observer.next(1);
    }).subscribe(sub).unsubscribe(sub);
  });

  test("called when the subscriber is destroyed", (done) => {
    const debugHook: RushDebugHook<number> = {
      onUnlisten: (option) => {
        expect(option).toBe("destroy");
        done();
      },
    };

    const sub = new RushSubscriber<number>({ debugHook });

    new RushStream<number>((observer) => {
      observer.next(1);
    }).subscribe(sub);

    sub.destroy();
  });

  test("called when the stream is completed", (done) => {
    const debugHook: RushDebugHook<number> = {
      onUnlisten: (option) => {
        expect(option).toBe("complete");
        done();
      },
    };

    const sub = new RushSubscriber<number>({ debugHook });

    new RushStream<number>((observer) => {
      observer.next(1);
    }).subscribe(sub).listen({
      complete: () => { }
    }).unlisten('complete');
  });

  test("called when an error occurs in the subscriber", (done) => {
    const errorSpy = jest.fn();

    const debugHook: RushDebugHook<number> = {
      onError: (err) => {
        expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
        done();
      }
    };

    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    }, { continueOnError: true });

    const sub = new RushSubscriber<number>({ continueOnError: true, debugHook });
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
  });
});
