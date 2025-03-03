import { RushDebugHook, RushStream, RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe("Debugging in RushStream", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("should called when a value is emitted", async () => {
    const debugHook: RushDebugHook<number> = {
      onEmit: (value) => {
        expect(value).toBe(1);
      }
    };

    new RushStream<number>((observer) => {
      observer.next(1);
    }, { debugHook });
  });

  test("should called when a subscriber is added", async () => {
    const debugHook: RushDebugHook<number> = {
      onSubscribe: (sub: RushSubscriber) => {
        expect(sub).toBeInstanceOf(RushSubscriber);
      }
    };

    const sub = new RushSubscriber<number>();

    new RushStream<number>((observer) => {
      observer.next(1);
    }, { debugHook }).subscribe(sub);
  });

  test("should called when a subscriber is removed", async () => {
    const debugHook: RushDebugHook<number> = {
      onUnsubscribe: (sub: RushSubscriber) => {
        expect(sub).toBeInstanceOf(RushSubscriber);
      }
    };

    const sub = new RushSubscriber<number>();

    new RushStream<number>((observer) => {
      observer.next(1);
    }, { debugHook }).subscribe(sub).unsubscribe(sub);
  });

  test("should called when new listener is attached", async () => {
    const debugHook: RushDebugHook<number> = {
      onListen: (observer) => {
        expect(observer).toHaveProperty("next");
        expect(observer).toHaveProperty("error");
        expect(observer).toHaveProperty("complete");
      }
    };

    new RushStream<number>((observer) => {
      observer.next(1);
    }, { debugHook }).listen({
      next: (value) => { },
      error: (err) => { },
      complete: () => { }
    });
  });

  test("should called when the stream is stopped", async () => {
    const debugHook: RushDebugHook<number> = {
      onUnlisten: (option) => {
        expect(option).toBe("complete");
      },
    };

    new RushStream<number>((observer) => {
      observer.next(1);
    }, { debugHook }).unlisten('complete');
  });

  test("should called when an error occurs in the stream", async () => {
    const errorSpy = jest.fn();

    const debugHook: RushDebugHook<number> = {
      onError: (err) => {
        expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
      }
    };

    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    }, { continueOnError: true, debugHook });

    stream
      .use((value) => {
        if (value < 2) throw new Error("error");
        else return value;
      })
      .listen({
      next: (value) => { },
      error: errorSpy
    });
  });
});
