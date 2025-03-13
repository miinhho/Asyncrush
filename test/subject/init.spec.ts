import { BackpressureController } from "../../lib";
import { RushSubject } from "../../lib/core";

describe("initialization", () => {
  it("should create a new RushStream", () => {
    const subject = new RushSubject();
    expect(subject.getBackpressureController()).toBeInstanceOf(BackpressureController);
  });
});
