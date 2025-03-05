import { streamFromDynamicTargets } from "../../lib";

describe("streamFromDynamicTargets", () => {
  let container: any;
  let mockObserverCallback: jest.Mock;

  beforeAll(() => {
    global.MutationObserver = class {
      constructor(callback: MutationCallback) {
        mockObserverCallback = jest.fn(callback);
      }
      observe = jest.fn();
      disconnect = jest.fn();
    } as any;
  });

  beforeEach(() => {
    container = {
      querySelectorAll: jest.fn(() => []),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      appendChild: jest.fn(),
    } as any;
  });

  test("emits events from initial targets", async () => {
    const button = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn((event) => true),
    };
    container.querySelectorAll.mockReturnValue([button]);

    const stream = streamFromDynamicTargets<Event>(container, "button", "click");
    const mockNext = jest.fn();

    stream.listen({
      next: mockNext,
      complete: () => {},
      error: (err) => { },
    });

    const clickEvent = new Event("click");
    button.dispatchEvent(clickEvent);

    setTimeout(() => {
      expect(mockNext).toHaveBeenCalledWith(clickEvent);
    }, 0);
  });

  test("updates listeners when DOM changes", async () => {
    const initialButton = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn((event) => true),
    };
    const newButton = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn((event) => true),
    };

    container.querySelectorAll.mockReturnValueOnce([initialButton]);
    const stream = streamFromDynamicTargets<Event>(container, "button", "click");
    const mockNext = jest.fn();

    stream.listen({
      next: mockNext,
      complete: () => {},
      error: (err) => { },
    });

    container.querySelectorAll.mockReturnValueOnce([initialButton, newButton]);
    mockObserverCallback([{} as any], null);

    const clickEvent = new Event("click");
    newButton.dispatchEvent(clickEvent);

    setTimeout(() => {
      expect(mockNext).toHaveBeenCalledWith(clickEvent);
      expect(initialButton.removeEventListener).toHaveBeenCalled();
      expect(newButton.addEventListener).toHaveBeenCalled();
    }, 0);
  });

  test("unlistens and disconnects observer", async () => {
    container.querySelectorAll.mockReturnValue([]);
    const stream = streamFromDynamicTargets<Event>(container, "button", "click");
    const subscription = stream.listen({
      next: () => {},
      complete: () => {},
      error: () => {},
    });

    subscription.unlisten();

    setTimeout(() => {
      expect(container.removeEventListener).not.toHaveBeenCalled();
      expect((MutationObserver as any).prototype.disconnect).toHaveBeenCalled();
      container.querySelectorAll.forEach((target) => {
        expect(target.removeEventListener).toHaveBeenCalled();
      });
    }, 0);
  });
});
