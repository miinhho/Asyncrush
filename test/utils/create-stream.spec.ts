import { BackpressureController, createStream, RushStream } from "../../lib";

describe("createStream", () => {
  it("should create optimized stream", () => {
    const producerMock = jest.fn();
    const stream = createStream(producerMock);

    expect(stream).toBeInstanceOf(RushStream);
    expect(stream.getBackpressureController()).toBeInstanceOf(BackpressureController);
  });
});
