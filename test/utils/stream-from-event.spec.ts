import EventEmitter from "node:events";
import { RushDebugHook, streamFromEvent } from "../../lib";

jest.useFakeTimers();

describe("streamFromEvent", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("emits single argument events", (done) => {
    const emitter = new EventEmitter();
    const stream = streamFromEvent<string>(emitter, "data");
    const mockNext = jest.fn();

    stream.listen({ next: mockNext });

    emitter.emit("data", "hello");

    expect(mockNext).toHaveBeenCalledWith("hello");
    done();
  });

  test("emits multi-argument events", (done) => {
    const emitter = new EventEmitter();
    const stream = streamFromEvent(emitter, "data");
    const mockNext = jest.fn();

    stream.listen({ next: mockNext });

    emitter.emit("data", "hello", "world");

    expect(mockNext).toHaveBeenCalledWith(["hello", "world"]);
    done();
  });

  test("completes on 'end' event", (done) => {
    const emitter = new EventEmitter();
    const stream = streamFromEvent(emitter, "data");
    const mockComplete = jest.fn();

    stream.listen({ complete: mockComplete });

    emitter.emit('end');

    jest.advanceTimersByTime(0);
    expect(mockComplete).toHaveBeenCalled();
    expect(emitter.listenerCount('end')).toBe(0);
    expect(emitter.listenerCount('data')).toBe(0);
    expect(emitter.listenerCount('error')).toBe(0);
    done();
  });

  test("errors on 'error' event", (done) => {
    const emitter = new EventEmitter();
    const debug: RushDebugHook = {
      onError: (err) => {
        console.error(err);
      }
    };
    const stream = streamFromEvent(emitter, "data", { continueOnError: true, debug });
    const mockError = jest.fn();

    stream.listen({
      next: (value) => { },
      error: mockError,
      complete: () => { }
    });

    emitter.emit('error', new Error('error'));

    jest.advanceTimersByTime(0);
    expect(mockError).toHaveBeenCalled();
    done();
  });
});
