import { RushStream } from '../../lib';

describe('event handling', () => {
  test('should emit events to listeners', () => {
    const nextSpy = jest.fn();

    const stream = new RushStream<string>((observer) => {
      observer.next('event1');
      observer.next('event2');
    });

    stream.listen({
      next: nextSpy
    });

    expect(nextSpy).toHaveBeenCalledTimes(2);
    expect(nextSpy).toHaveBeenNthCalledWith(1, 'event1');
    expect(nextSpy).toHaveBeenNthCalledWith(2, 'event2');
  });

  test('should handle errors from producer', () => {
    const errorSpy = jest.fn();
    const testError = new Error('Test error');

    const stream = new RushStream<string>((observer) => {
      observer.error(testError);
    });

    stream.listen({
      error: errorSpy
    });

    expect(errorSpy).toHaveBeenCalledWith(testError);
  });

  test('should handle completion from producer', () => {
    const completeSpy = jest.fn();

    const stream = new RushStream<string>((observer) => {
      observer.complete();
    });

    stream.listen({
      complete: completeSpy
    });

    expect(completeSpy).toHaveBeenCalledTimes(1);
  });
});
