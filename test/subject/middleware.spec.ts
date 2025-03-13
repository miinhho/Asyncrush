import { RushSubject } from "../../lib/core";

describe("flow control", () => {
  let subject: RushSubject;

  beforeEach(() => {
    subject = new RushSubject();
  });

  it("should call next", () => {
    const nextSpy = jest.fn();
    const handler1 = (value: number) => value + 1;
    const handler2 = (value: number) => value * 2;

    subject.use(handler1, handler2, nextSpy);
    subject.next(1);

    expect(nextSpy).toHaveBeenCalledWith(4);
  });
});
