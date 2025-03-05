import EventEmitter from "node:events";
import { streamFromEvents } from "../../lib";

jest.useFakeTimers();

describe("streamFromEvents", () => {
  let emitter1: EventEmitter;
  let emitter2: EventEmitter;

  beforeEach(() => {
    emitter1 = new EventEmitter();
    emitter2 = new EventEmitter();
    jest.clearAllTimers();
  });

  test("emits events from multiple EventEmitters", (done) => {
    const stream = streamFromEvents<any[]>([emitter1, emitter2], "data");
    const mockNext = jest.fn();

    stream.listen({
      next: (value) => {
        mockNext(value);
      },
      complete: () => {},
      error: (err) => {},
    });

    emitter1.emit("data", "from emitter1");
    emitter2.emit("data", "from emitter2", 456);

    expect(mockNext).toHaveBeenCalledWith("from emitter1");
    expect(mockNext).toHaveBeenCalledWith(["from emitter2", 456]);
    expect(mockNext).toHaveBeenCalledTimes(2);
    done();
  });

  test("unlistens from all emitters", (done) => {
    const stream = streamFromEvents([emitter1, emitter2], "data");
    const listener = stream.listen({
      next: () => {},
      complete: () => {},
      error: () => {},
    });

    listener.unlisten();

    expect(emitter1.listenerCount("data")).toBe(0);
    expect(emitter1.listenerCount("end")).toBe(0);
    expect(emitter1.listenerCount("error")).toBe(0);
    expect(emitter2.listenerCount("data")).toBe(0);
    expect(emitter2.listenerCount("end")).toBe(0);
    expect(emitter2.listenerCount("error")).toBe(0);
    done();
  });

  test("handles errors in event handler", (done) => {
    const stream = streamFromEvents([emitter1, emitter2], "data");
    const mockError = jest.fn();

    stream.listen({
      next: () => { throw new Error("Handler error"); },
      complete: () => {},
      error: (err) => {
        mockError(err);
      },
    });

    emitter1.emit("data", "test");

    expect(mockError).toHaveBeenCalledWith(expect.any(Error));
    done();
  });
});
