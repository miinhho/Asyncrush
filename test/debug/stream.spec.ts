import { RushDebugHook, RushStream, RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe("Debugging in RushStream", () => {
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

    new RushStream<number>((observer) => {
      observer.next(1);
    }, { debugHook }).listen({
      next: (value) => { },
      error: (err) => { },
      complete: () => { }
    })
  });

  test("called when a subscriber is added", (done) => {
    const debugHook: RushDebugHook<number> = {
      onSubscribe: (sub: RushSubscriber) => {
        expect(sub).toBeInstanceOf(RushSubscriber);
        done();
      }
    };

    const sub = new RushSubscriber<number>();

    new RushStream<number>((observer) => {
      observer.next(1);
    }, { debugHook }).subscribe(sub);
  });

  test("called when a subscriber is removed", (done) => {
    const debugHook: RushDebugHook<number> = {
      onUnsubscribe: (sub: RushSubscriber) => {
        expect(sub).toBeInstanceOf(RushSubscriber);
        done();
      }
    };

    const sub = new RushSubscriber<number>();

    new RushStream<number>((observer) => {
      observer.next(1);
    }, { debugHook }).subscribe(sub).unsubscribe(sub);
  });

  test("called when new listener is attached", (done) => {
    const debugHook: RushDebugHook<number> = {
      onListen: (observer) => {
        expect(observer).toHaveProperty("next");
        expect(observer).toHaveProperty("error");
        expect(observer).toHaveProperty("complete");
        done();
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

  test("called when the stream is stopped", (done) => {
    const debugHook: RushDebugHook<number> = {
      onUnlisten: (option) => {
        expect(option).toBe("complete");
        done();
      },
    };

    new RushStream<number>((observer) => {
      observer.next(1);
    }, { debugHook }).unlisten('complete');
  });

  test("called when an error occurs in the stream", (done) => {
    const errorSpy = jest.fn();

    const debugHook: RushDebugHook<number> = {
      onError: (err) => {
        expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
        done();
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
