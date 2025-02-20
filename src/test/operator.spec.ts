import { EmitStream } from '@emiter/emit-stream';
import { filter } from '@operator/filter';
import { map } from '@operator/map';

describe('Operator', () => {
  test('should apply map operator correctly', (done) => {
    const results: number[] = [];

    new EmitStream<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
      observer.complete();

      return () => { };
    }).pipe(
      map((value) => value * 2)
    ).listen({
      next: (value) => results.push(value),
      complete: () => {
        expect(results).toEqual([2, 4, 6]);
        done();
      }
    });
  });

  test('should apply filter operator correctly', (done) => {
    const results: number[] = [];

    new EmitStream<number>((observer) => {
      observer.next(1);
      observer.next(2);
      observer.next(3);
      observer.next(4);
      observer.complete();

      return () => { };
    }).pipe(
      filter((value) => value % 2 === 0)
    ).listen({
      next: (value) => results.push(value),
      complete: () => {
        expect(results).toEqual([2, 4]);
        done();
      }
    });
  });
});
