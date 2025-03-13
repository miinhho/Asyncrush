import { mergeStream, RushObserver, RushStream } from "../../lib";

describe("mergeStream", () => {
  let source1: RushObserver<number>;
  let source2: RushObserver<number>;
  let stream1: RushStream<number>;
  let stream2: RushStream<number>;

  beforeEach(() => {
    stream1 = new RushStream((observer) => { source1 = observer });
    stream2 = new RushStream((observer) => { source2 = observer });
  });

  it("should merge stream", () => {
    const nextSpy = jest.fn();

    mergeStream([stream1, stream2])
      .listen({
        next: nextSpy
      });

    source1!.next(1);
    expect(nextSpy).toHaveBeenCalledWith(1);
    expect(nextSpy).toHaveBeenCalledTimes(1);

    source2!.next(2);
    expect(nextSpy).toHaveBeenCalledWith(2);
    expect(nextSpy).toHaveBeenCalledTimes(2);
  });

  it("should complete when no stream is in array", () => {
    const completeSpy = jest.fn();

    mergeStream([])
      .listen({
        complete: completeSpy
      });

    expect(completeSpy).toHaveBeenCalled();
  });

  it("should complete when every stream completed", () => {
    const completeSpy = jest.fn();

    mergeStream([stream1, stream2])
      .listen({
        next: () => { },
        complete: completeSpy
      });

    source1!.complete();
    expect(completeSpy).not.toHaveBeenCalled();

    source2!.complete();
    expect(completeSpy).toHaveBeenCalled();
  });

  it("should catch error in streams", () => {
    const errorSpy = jest.fn();
    const testError = new Error("test error");

    mergeStream([stream1, stream2])
      .listen({
        next: () => { },
        error: errorSpy
      });

    source1!.error(testError);
    expect(errorSpy).toHaveBeenCalledWith(testError);
  });
});
