import { RushDebugHook, RushStream, RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe("Debugging in RushSubscriber", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("should called when a value is emitted", async () => {
    const debugHook: RushDebugHook<number> = {
      onEmit: (value) => {
        expect(value).toBe(1);
      }
    };

    const sub = new RushSubscriber<number>({ debugHook });

    new RushStream<number>((observer) => {
      observer.next(1);
    }).subscribe(sub);
  });

  test("should called when a subscriber is added", async () => {
    const debugHook: RushDebugHook<number> = {
      onSubscribe: (subscriber) => {
        expect(subscriber).toBeInstanceOf(RushSubscriber);
      }
    };

    const sub = new RushSubscriber<number>({ debugHook });

    new RushStream<number>((observer) => {
      observer.next(1);
    }).subscribe(sub);
  });

  test("should called when a subscriber is removed", async () => {
    const debugHook: RushDebugHook<number> = {
      onUnsubscribe: (subscriber) => {
        expect(subscriber).toBeInstanceOf(RushSubscriber);
      }
    };

    const sub = new RushSubscriber<number>({ debugHook });

    new RushStream<number>((observer) => {
      observer.next(1);
    }).subscribe(sub).unsubscribe(sub);
  });

  test("should called when the subscriber is destroyed", async () => {
    const debugHook: RushDebugHook<number> = {
      onUnlisten: (option) => {
        expect(option).toBe("destroy");
      },
    };

    const sub = new RushSubscriber<number>({ debugHook });

    new RushStream<number>((observer) => {
      observer.next(1);
    }).subscribe(sub);

    sub.destroy();
  });

  test("should called when the stream is completed", async () => {
    const debugHook: RushDebugHook<number> = {
      onUnlisten: (option) => {
        expect(option).toBe("complete");
      },
    };

    const sub = new RushSubscriber<number>({ debugHook });

    new RushStream<number>((observer) => {
      observer.next(1);
    }).subscribe(sub).unlisten('complete');
  });

  test("should called when an error occurs in the subscriber", async () => {
    const errorSpy = jest.fn();

    const debugHook: RushDebugHook<number> = {
      onError: (err) => {
        expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
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
