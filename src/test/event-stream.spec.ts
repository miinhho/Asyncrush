import { EmitStream } from '@emiter/emit-stream';
import { filter } from '@operator/filter';
import { map } from '@operator/map';

describe('EmitStream', () => {
  test('should emit values and complete', (done) => {
    const values: number[] = [];

    const sourceStream = new EmitStream<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
      observer.complete();

      return () => { };
    });

    sourceStream.listen({
      next: (value) => values.push(value),
      complete: () => {
        expect(values).toEqual([1, 2, 3]);
        done();
      }
    });
  });

  test('should call error callback when an error occurs', (done) => {
    const errorMessage = 'Error occurred';

    const sourceStream = new EmitStream<number>((observer) => {
      observer.error(new Error(errorMessage));

      return () => { };
    });

    sourceStream.listen({
      next: () => { },
      error: (err) => {
        expect(err.message).toBe(errorMessage);
        done();
      }
    });
  });

  test('should apply map operator correctly', (done) => {
    const sourceStream = new EmitStream<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
      observer.complete();

      return () => { };
    });

    const mappedPipe = sourceStream.pipe(
      map((value) => value * 2)
    );

    const results: number[] = [];

    mappedPipe.listen({
      next: (value) => results.push(value),
      complete: () => {
        expect(results).toEqual([2, 4, 6]);
        done();
      }
    });
  });

  test('should apply filter operator correctly', (done) => {
    const sourceStream = new EmitStream<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
      observer.next(4);
      observer.complete();

      return () => { };
    });

    const filteredPipe = sourceStream.pipe(
      filter((value) => value % 2 === 0)
    );

    const results: number[] = [];

    filteredPipe.listen({
      next: (value) => results.push(value),
      complete: () => {
        expect(results).toEqual([2, 4]);
        done();
      }
    });
  });

  test('should allow unsubscribe before complete', (done) => {
    let count = 0;

    const sourceStream = new EmitStream<number>((observer) => {
      const interval = setInterval(() => {
        observer.next(++count);
      }, 10);

      return () => clearInterval(interval);
    });

    const listener = sourceStream.listen({
      next: (value) => {
        if (value === 2) {
          listener.unlisten();
          setTimeout(() => {
            expect(count).toBe(2);
            done();
          }, 30);
        }
      }
    })
  })
});
