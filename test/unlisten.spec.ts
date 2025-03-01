import { RushStream } from "../lib/stream/rush-stream";

jest.useFakeTimers();

describe('RushStream `unlisten` method', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("should call clean up function", (done) => {
    const message = 'unlisten';
    const stream = new RushStream<number>((observer) => {
      observer.next(1);

      return () => {
        expect(message).toBe('unlisten');
        done();
      }
    });

    stream
      .use((v) => v)
      .listen({
        next: (value) => { },
        complete: () => {},
      });

    stream.unlisten();
  });

  test("should not call complete event if unlisten with destroy option", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockComplete = jest.fn();
    stream
      .use((v) => v)
      .listen({
        next: (value) => { },
        complete: () => {
          mockComplete();
        },
      });

    stream.unlisten('destroy');
    expect(mockComplete).not.toHaveBeenCalled();
    done();
  })
});
