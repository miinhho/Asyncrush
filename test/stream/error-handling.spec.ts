import { RushObserver, RushStream } from "../../lib";

describe('error handling', () => {
  it('should stop processing events after error when continueOnError is false', () => {
    const nextSpy = jest.fn();
    const errorSpy = jest.fn();
    const testError = new Error('Test error');

    let sourceObserver: RushObserver<number>;
    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    });

    stream.listen({
      next: nextSpy,
      error: errorSpy
    });

    sourceObserver!.next(1);
    expect(nextSpy).toHaveBeenCalledWith(1);

    sourceObserver!.error(testError);
    expect(errorSpy).toHaveBeenCalledWith(testError);

    sourceObserver!.next(2);
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('should continue processing events after error when continueOnError is true', () => {
    const nextSpy = jest.fn();
    const errorSpy = jest.fn();
    const testError = new Error('Test error');

    let sourceObserver: RushObserver<number>;

    const stream = new RushStream<number>((observer) => {
      sourceObserver = observer;
    }, {
      continueOnError: true
    });

    stream.listen({
      next: nextSpy,
      error: errorSpy
    });

    sourceObserver!.next(1);
    expect(nextSpy).toHaveBeenCalledWith(1);

    sourceObserver!.error(testError);
    expect(errorSpy).toHaveBeenCalledWith(testError);

    sourceObserver!.next(2);
    expect(nextSpy).toHaveBeenCalledTimes(2);
    expect(nextSpy).toHaveBeenLastCalledWith(2);
  });
});
