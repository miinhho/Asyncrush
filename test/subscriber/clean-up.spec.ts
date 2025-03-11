import { RushSubscriber } from "../../lib";

describe('cleanup', () => {
  test("should complete subscriber", () => {
    const completeSpy = jest.fn();
    const sub = new RushSubscriber();

    sub.onComplete(completeSpy);
    sub.complete();

    expect(completeSpy).toHaveBeenCalled();
  });

  test("should destroy subscriber", () => {
    const nextSpy = jest.fn();
    const sub = new RushSubscriber();

    sub.onNext(nextSpy);
    sub.destroy();

    sub.next(1);
    expect(nextSpy).not.toHaveBeenCalled();
  });
});
