import { RushStream } from "../lib/stream/rush-stream";

jest.useFakeTimers();

describe('RushStream `subscribe` method', () => {
  test("subscribe should broadcast events to multiple subscribers", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockSub1 = jest.fn();
    const mockSub2 = jest.fn();
    const sub1 = stream.subscribe();
    const sub2 = stream.subscribe();

    sub1.on('next', (value) => mockSub1(value));
    sub2.on('next', (value) => mockSub2(value));
    stream.listen({
      next: () => { },
      complete: () => { },
    });

    expect(mockSub1).toHaveBeenCalledTimes(1);
    expect(mockSub1).toHaveBeenCalledWith(1);
    expect(mockSub2).toHaveBeenCalledTimes(1);
    expect(mockSub2).toHaveBeenCalledWith(1);
    done();
  });
});
