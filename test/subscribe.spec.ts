import { RushStream } from "../lib/stream/rush-stream";
import { RushSubscriber } from "../lib/stream/rush-subscriber";

jest.useFakeTimers();

describe('RushStream `subscribe` method', () => {
  test("subscribe should broadcast events to multiple subscribers", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockSub1 = jest.fn();
    const mockSub2 = jest.fn();
    const sub1 = new RushSubscriber<any>({ continueOnError: true });
    const sub2 = new RushSubscriber<number>({ continueOnError: true });

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
});
