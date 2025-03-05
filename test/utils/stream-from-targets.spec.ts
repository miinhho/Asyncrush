/**
 * @jest-environment jsdom
 */
import { streamFromTargets } from "../../lib";

jest.useFakeTimers();

describe("streamFromTargets", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("emits events from multiple targets", (done) => {
    const buttons = [
      document.createElement('button'),
      document.createElement('button'),
    ];
    const stream = streamFromTargets<Event>(buttons, "click");
    const mockNext = jest.fn();

    stream.listen({
      next: mockNext,
      complete: () => {},
      error: () => {},
    });

    const clickEvent = new Event("click");
    buttons[0].dispatchEvent(clickEvent);
    buttons[1].dispatchEvent(clickEvent);

    jest.advanceTimersByTime(1);
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(clickEvent);
    done();
  });

  test("unlisten from all targets", (done) => {
    const mockNext = jest.fn();
    const buttons = [
      document.createElement('button'),
      document.createElement('button'),
    ];
    const stream = streamFromTargets<Event>(buttons, "click");
    const listener = stream.listen({
      next: mockNext,
      complete: () => {},
      error: () => {},
    });

    listener.unlisten();
    buttons.forEach((button) => {
      button.dispatchEvent(new Event("click"));
      expect(mockNext).not.toHaveBeenCalled();
    });
    done();
  });
});
