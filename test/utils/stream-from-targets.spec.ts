import { streamFromTargets } from "../../lib";

describe("streamFromTargets", () => {
  let buttons: any[];

  beforeEach(() => {
    buttons = [
      { addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn() },
      { addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn() },
    ];
  });

  test("emits events from multiple targets", async () => {
    const stream = streamFromTargets<Event>(buttons, "click");
    const mockNext = jest.fn();

    stream.listen({
      next: (value) => {
        mockNext();
        expect(mockNext).toHaveBeenCalledTimes(2);
        expect(mockNext).toHaveBeenCalledWith(clickEvent);
      },
      complete: () => {},
      error: () => {},
    });

    const clickEvent = new Event("click");
    buttons[0].dispatchEvent(clickEvent);
    buttons[1].dispatchEvent(clickEvent);
  });

  test("unlisten from all targets", async () => {
    const stream = streamFromTargets<Event>(buttons, "click");
    const listener = stream.listen({
      next: () => {},
      complete: () => {},
      error: () => {},
    });

    listener.unlisten();
    setTimeout(() => {
      buttons.forEach((button) => {
        expect(button.removeEventListener).toHaveBeenCalledWith("click", expect.any(Function));
      });
    }, 0);
  });
});
