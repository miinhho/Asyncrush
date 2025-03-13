import { BackpressureController, createSubscriber, RushSubscriber } from "../../lib";

describe("createSubscriber", () => {
  it("should create optimized subscriber", () => {
    const subscriber = createSubscriber();
    expect(subscriber).toBeInstanceOf(RushSubscriber);
    expect(subscriber.getBackpressureController()).toBeInstanceOf(BackpressureController);
  });
});
