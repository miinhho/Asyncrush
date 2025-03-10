import { combineLatest, RushObserver, RushStream } from "../../lib";

describe("combineLast", () => {
  let source1: RushObserver<number>;
  let source2: RushObserver<number>;
  let stream1: RushStream<number>;
  let stream2: RushStream<number>;

  beforeEach(() => {
    stream1 = new RushStream((observer) => { source1 = observer });
    stream2 = new RushStream((observer) => { source2 = observer });
  });

  test("should combine latest value", () => {
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

  test("should complete every stream completed", () => {
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

  test("should catch error in combiner", () => {
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
