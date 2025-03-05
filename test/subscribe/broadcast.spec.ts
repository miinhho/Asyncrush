import { RushStream, RushSubscriber } from "../../lib";

jest.useFakeTimers();

describe("Broadcast from RustStream to RushSubscriber", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test("broadcast events to multiple subscribers", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockSub1 = jest.fn();
    const mockSub2 = jest.fn();
    const sub1 = new RushSubscriber<any>();
    const sub2 = new RushSubscriber<number>();

    sub1.use((value) => mockSub1(value));
    sub2.use((value) => mockSub2(value));

    stream.subscribe(sub1, sub2);
    stream.listen({
      next: () => {},
      complete: () => { },
    });

    expect(mockSub1).toHaveBeenCalledTimes(1);
    expect(mockSub1).toHaveBeenCalledWith(1);
    expect(mockSub2).toHaveBeenCalledTimes(1);
    expect(mockSub2).toHaveBeenCalledWith(1);
    done();
  });

  test("transform data with middleware", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockSub = jest.fn();
    const sub = new RushSubscriber<number>();

    sub.use(
      (value) => value + 3,
      (value) => value * 2,
      (value) => mockSub(value)
    ).subscribe(stream);

    stream.listen({
      next: () => {},
      complete: () => { },
    });

    expect(mockSub).toHaveBeenCalledTimes(1);
    expect(mockSub).toHaveBeenCalledWith(8);
    done();
  });

  test("completion stream broadcasted to subscribers", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockSub = jest.fn();
    const sub = new RushSubscriber<number>();

    sub.onComplete(() => {
      mockSub();
    });

    stream.subscribe(sub).listen({
      next: () => { },
      complete: () => { },
    }).unlisten('complete');

    expect(mockSub).toHaveBeenCalledTimes(1);
    done();
  });
});
