import { RushStream, RushSubscriber } from "../../dist/lib";

describe("RushSubscriber Destroy", () => {
  test("unsubscribe if it destroyed", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockSub = jest.fn();
    const sub = new RushSubscriber<number>();

    sub.use((value) => mockSub(value)).subscribe(stream);
    sub.destroy();

    stream.listen({
      next: () => { },
      complete: () => { },
    });

    expect(mockSub).not.toHaveBeenCalled();
    expect(stream.subscribers.size).toBe(0);
    done();
  });
});
