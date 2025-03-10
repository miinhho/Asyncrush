import { createSubscriber, RushSubscriber } from "../../lib";

describe("createSubscriber", () => {
  test("should create optimized subscriber", () => {
    const subscriber = createSubscriber();
    expect(subscriber).toBeInstanceOf(RushSubscriber);
  });
});
