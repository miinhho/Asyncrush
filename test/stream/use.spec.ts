import { RushStream } from "../../lib";

jest.useFakeTimers();

describe('RushStream Use Middleware', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("apply middleware transformations", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    stream.use(
      (v: number) => v + 1,
      (v: number) => v * 2
    ).listen({
      next: (value) => {
        expect(value).toBe(4);
        done();
      },
      complete: () => { },
    });
  });
});
