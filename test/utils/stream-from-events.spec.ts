import EventEmitter from "node:events";
import { streamFromEvents } from "../../lib";

describe("streamFromEvents", () => {
  let emitter1: EventEmitter;
  let emitter2: EventEmitter;

  beforeEach(() => {
    emitter1 = new EventEmitter();
    emitter2 = new EventEmitter();
  });

  test("emits events from multiple EventEmitters", async () => {
    const stream = streamFromEvents<any[]>([emitter1, emitter2], "data");
    const mockNext = jest.fn();

    stream.listen({
      next: (value) => {
        mockNext(value);
        expect(mockNext).toHaveBeenCalledWith("from emitter1");
        expect(mockNext).toHaveBeenCalledWith(["from emitter2", 456]);
        expect(mockNext).toHaveBeenCalledTimes(2);
      },
      complete: () => {},
      error: (err) => {},
    });

    emitter1.emit("data", "from emitter1");
    emitter2.emit("data", "from emitter2", 456);
  });

  test("completes on 'end' from any emitter", async () => {
    const stream = streamFromEvents([emitter1, emitter2], "data");
    const mockComplete = jest.fn();

    stream.listen({
      next: () => {},
      complete: () => {
        mockComplete();
        expect(emitter1.listenerCount("end")).toBe(0);
        expect(emitter2.listenerCount("end")).toBe(0);
      },
      error: (err) => { },
    });

    emitter2.emit("end");
  });

  test("errors on 'error' from any emitter", async () => {
    const stream = streamFromEvents([emitter1, emitter2], "data");
    const mockError = jest.fn();

    stream.listen({
      next: () => {},
      complete: () => {},
      error: (err) => {
        mockError(err);
        expect(mockError).toHaveBeenCalledWith(err);
        expect(emitter1.listenerCount("error")).toBe(0);
        expect(emitter2.listenerCount("error")).toBe(0);
      },
    });

    const err = new Error("Test error");
    emitter1.emit("error", err);
  });

  test("unlistens from all emitters", async () => {
    const stream = streamFromEvents([emitter1, emitter2], "data");
    const subscription = stream.listen({
      next: () => {},
      complete: () => {},
      error: () => {},
    });

    subscription.unlisten();

    expect(emitter1.listenerCount("data")).toBe(0);
    expect(emitter1.listenerCount("end")).toBe(0);
    expect(emitter1.listenerCount("error")).toBe(0);
    expect(emitter2.listenerCount("data")).toBe(0);
    expect(emitter2.listenerCount("end")).toBe(0);
    expect(emitter2.listenerCount("error")).toBe(0);
  });

  test("handles errors in event handler", async () => {
    const stream = streamFromEvents([emitter1, emitter2], "data");
    const mockError = jest.fn();

    stream.listen({
      next: () => { throw new Error("Handler error"); },
      complete: () => {},
      error: (err) => {
        mockError(err);
        expect(mockError).toHaveBeenCalledWith(expect.any(Error));
      },
    });

    emitter1.emit("data", "test");
  });
});
