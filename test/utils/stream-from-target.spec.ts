/**
 * @jest-environment jsdom
 */
import { streamFromTarget } from "../../lib";

jest.useFakeTimers();

describe("streamFromTarget", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("emits DOM events", (done) => {
    const div = document.createElement("div");
    const stream = streamFromTarget<Event>(div, "click");
    const mockNext = jest.fn();

    stream.listen({
      next: mockNext,
    });

    const clickEvent = new Event("click");
    div.dispatchEvent(clickEvent);

    jest.advanceTimersByTime(1);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Event));
    done();
  });

  test("unlistens from DOM events", (done) => {
    const mockNext = jest.fn();
    const div = document.createElement("div");
    const stream = streamFromTarget<Event>(div, "click");
    const listener = stream.listen({
      next: mockNext,
      complete: () => {},
      error: () => {},
    });

    listener.unlisten();
    div.dispatchEvent(new Event("click"));

    jest.advanceTimersByTime(1);
    expect(mockNext).not.toHaveBeenCalled();
    done();
  });
});
