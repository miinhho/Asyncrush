import { EmitStream } from '@emiter/emit-stream';

describe('EmitStream', () => {
  test('should emit values and complete', (done) => {
    const values: number[] = [];

    new EmitStream<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
      observer.complete();

      return () => { };
    }).listen({
      next: (value) => values.push(value),
      complete: () => {
        expect(values).toEqual([1, 2, 3]);
        done();
      }
    });
  });

  test('should call error callback when an error occurs', (done) => {
    const errorMessage = 'Error occurred';

    new EmitStream<number>((observer) => {
      observer.error(new Error(errorMessage));

      return () => { };
    }).listen({
      next: () => { },
      error: (err) => {
        expect(err.message).toBe(errorMessage);
        done();
      }
    });
  });
});
