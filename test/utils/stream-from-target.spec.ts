import { streamFromTarget } from "../../lib";

global.document = {
  createElement: (tag: string) => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: (event: Event) => true,
  }),
} as any;

describe("streamFromTarget", () => {
  let button: any;

  beforeEach(() => {
    button = document.createElement("button");
  });

  test("emits DOM events", async () => {
    const stream = streamFromTarget<Event>(button, "click");
    const mockNext = jest.fn();

    stream.listen({
      next: (event) => {
        mockNext(event);
        expect(mockNext).toHaveBeenCalledWith(clickEvent);
      },
      complete: () => {},
      error: () => {},
    });

    const clickEvent = new Event("click");
    button.dispatchEvent(clickEvent);
  });

  test("unlistens from DOM events", async () => {
    const stream = streamFromTarget<Event>(button, "click");
    const listener = stream.listen({
      next: () => {},
      complete: () => {},
      error: () => {},
    });

    listener.unlisten();
    expect(button.removeEventListener).toHaveBeenCalledTimes(1);
  });

  test("handles errors in DOM event handler", async () => {
    const stream = streamFromTarget<Event>(button, "click");
    const mockError = jest.fn();

    stream.listen({
      next: () => { throw new Error("Handler error"); },
      error: mockError,
    });

    const clickEvent = new Event("click");
    button.dispatchEvent(clickEvent);

    setTimeout(() => {
      expect(mockError).toHaveBeenCalledWith(expect.any(Error));
    }, 0);
  });
});
