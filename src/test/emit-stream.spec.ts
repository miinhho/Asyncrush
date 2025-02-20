import { EmitStream } from '@emiter/emit-stream';
import { captureRejectionSymbol } from 'node:stream';

describe('EmitStream', () => {
  test('should emit values and complete', (done) => {
    const values: number[] = [];

    new EmitStream((observer) => {
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

  test('should allow unsubscribe before complete', (done) => {
    let count = 0;

    const listener = new EmitStream((observer) => {
      const interval = setInterval(() => {
        observer.next(++count);
      }, 2);

      return () => clearInterval(interval);
    }).listen({
      next: (value) => {
        if (value === 2) {
          listener.unlisten();
          setTimeout(() => {
            expect(count).toBe(2);
            done();
          }, 6);
        }
      }
    });
  });

  test('should call error callback when an error occurs', (done) => {
    const errorMessage = 'Error occurred';

    new EmitStream((observer) => {
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

  test('should call error callback in captureRejectionSymbol', (done) => {
    const errorMessage = 'Error occurred';

    new EmitStream((observer) => {
      observer[captureRejectionSymbol](new Error(errorMessage), 'next');

      return () => { };
    }).listen({
      next: () => { },
      error: (err) => {
        expect(err.message).toBe(errorMessage);
        done();
      }
    })
  })
});
