import EventEmitter from "node:events";
import { streamFromEvent } from "../../lib";

describe("streamFromEvent", () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  test("emits single argument events", async () => {
    const stream = streamFromEvent<string>(emitter, "data");
    const mockNext = jest.fn();

    stream.listen({
      next: mockNext,
      complete: () => { },
      error: () => { },
    });

    emitter.emit("data", "hello");

    expect(mockNext).toHaveBeenCalledWith("hello");
  });

  test("emits multi-argument events", async () => {
    const stream = streamFromEvent(emitter, "data");
    const mockNext = jest.fn();

    stream.listen({
      next: mockNext,
      complete: () => { },
      error: () => { },
    });

    emitter.emit("data", "hello", "world");

    expect(mockNext).toHaveBeenCalledWith(["hello", "world"]);
  });

  test("completes on 'end' event", async () => {
    const stream = streamFromEvent(emitter, "data");
    const mockComplete = jest.fn();

    stream.listen({
      next: () => { },
      complete: () => {
        mockComplete();
        expect(mockComplete).toHaveBeenCalled();
        expect(emitter.listenerCount('end')).toBe(0);
        expect(emitter.listenerCount('data')).toBe(0);
        expect(emitter.listenerCount('error')).toBe(0);
      },
      error: () => { },
    });

    emitter.emit('end');
  });

  test("errors on 'error' event", async () => {
    const stream = streamFromEvent(emitter, "data");
    const mockError = jest.fn();

    stream.listen({
      next: () => { },
      complete: () => { },
      error: (err) => {
        mockError(err);
        expect(mockError).toHaveBeenCalledWith(new Error('test error'));
        expect(emitter.listenerCount('error')).toBe(0);
      },
    });

    const err = new Error('test error');
    emitter.emit('error', err);
  });
});
