import { RushObserver, RushStream, combineLatest } from "../../lib";

describe("combineLast", () => {
  let source1: RushObserver<number>;
  let source2: RushObserver<number>;
  let stream1: RushStream<number>;
  let stream2: RushStream<number>;

  beforeEach(() => {
    stream1 = new RushStream((observer) => { source1 = observer });
    stream2 = new RushStream((observer) => { source2 = observer });
  });

  it("should complete if there is no stream", () => {
    const completeSpy = jest.fn();
    const combiner = (...values: number[]) => [...values];

    combineLatest(
      [],
      combiner,
    ).listen({
      complete: completeSpy
    });

    expect(completeSpy).toHaveBeenCalled();
  });

  it("should combine latest value", () => {
    const nextSpy = jest.fn();
    const combiner = (...values: number[]) => [...values];

    combineLatest(
      [stream1, stream2],
      combiner,
    ).listen({
      next: nextSpy,
    });

    source1!.next(1);
    source2!.next(2);
    expect(nextSpy).toHaveBeenCalledWith([1, 2]);
  });

  it("should complete if combined stream completed", () => {
    const completeSpy = jest.fn();
    const combiner = (...values: number[]) => [...values];

    const combinedStream = combineLatest(
      [stream1, stream2],
      combiner,
    ).listen({
      next: () => { },
      complete: completeSpy
    });

    combinedStream.unlisten('complete');
    expect(completeSpy).toHaveBeenCalled();
  });

  it("should complete every stream completed", () => {
    const completeSpy = jest.fn();
    const combiner = (...values: number[]) => [...values];

    combineLatest(
      [stream1, stream2],
      combiner,
    ).listen({
      next: () => { },
      complete: completeSpy
    });

    source1!.complete();
    expect(completeSpy).not.toHaveBeenCalled();
    source2!.complete();
    expect(completeSpy).toHaveBeenCalled();
  });

  it("should catch error in stream", () => {
    const errorSpy = jest.fn();
    let source3: RushObserver;
    const stream3 = new RushStream((observer) => { source3 = observer });
    const testError = new Error("test error");
    const combiner = (...values: number[]) => [...values];

    combineLatest(
      [stream1, stream2, stream3],
      combiner,
    ).listen({
      next: () => { },
      error: errorSpy
    });

    source3!.error(testError);
    expect(errorSpy).toHaveBeenCalledWith(testError);
  });

  it("should catch error in combiner", () => {
    const errorSpy = jest.fn();
    const testError = new Error("test error");
    const combiner = (...values: number[]) => {
      throw testError;
    };

    combineLatest(
      [stream1, stream2],
      combiner,
    ).listen({
      next: () => { },
      error: errorSpy
    });

    source1!.next(1);
    source2!.next(2);
    expect(errorSpy).toHaveBeenCalledWith(testError);
  });
});
