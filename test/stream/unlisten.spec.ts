import { RushStream } from "../../dist/lib";

jest.useFakeTimers();

describe('RushStream Unlisten', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("call clean up function", (done) => {
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

  test("not call complete event if unlisten with destroy option", (done) => {
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
