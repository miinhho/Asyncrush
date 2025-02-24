import { RushStream } from "../lib/stream/rush-stream";

// Jest의 타이머 모킹 활성화
jest.useFakeTimers();

describe("RushStream Tests", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  // 1. listen 기능 테스트
  test("listen should receive events and chain handlers", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);

      setTimeout(() => {
        observer.complete();
      }, 100);
    });

    stream
      .use((v) => v)
      .listen({
      next: (value) => {
        expect(value).toBe(1);
        done();
      },
      complete: () => { },
    });
  });

  // // 2. subscribe & multicast
  // test("subscribe should broadcast events to multiple subscribers", (done) => {
  //   const stream = new RushStream<number>((observer) => {
  //     observer.next(1);
  //     observer.next(2);

  //     setTimeout(() => {
  //       observer.complete();
  //     }, 100);
  //   });

  //   const mockSub1 = jest.fn();
  //   const mockSub2 = jest.fn();
  //   const sub1 = stream.subscribe();
  //   const sub2 = stream.subscribe();

  //   sub1.on('next', (value) => mockSub1(value));
  //   sub2.on('next', (value) => mockSub2(value));
  //   sub1.on('complete', () => {
  //     expect(mockSub1).toHaveBeenCalledWith(2);
  //     expect(mockSub2).toHaveBeenCalledWith(2);
  //     done();
  //   });
  // });

  // 3. use
  test("use should apply middleware transformations", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockNext = jest.fn();
    stream.use(
      (v: number) => v + 1,
      (v: number) => v * 2,
    ).listen({
      next: (value) => {
        mockNext(value);
        expect(mockNext).toHaveBeenCalledWith(4);
        done();
      },
      complete: () => { },
    });
  });

  // // 5. throttle
  // test("throttle should limit event rate", (done) => {
  //   const stream = new RushStream<number>((observer) => {
  //     observer.next(0);
  //     observer.next(1);
  //     observer.next(2);

  //     setTimeout(() => {
  //       observer.complete();
  //     }, 100);
  //   });

  //   const mockNext = jest.fn();
  //   stream.throttle(10).listen({
  //     next: (value) => {
  //       mockNext(value);
  //     },
  //     complete: () => {
  //       expect(mockNext).toHaveBeenCalledTimes(2);
  //       expect(mockNext).toHaveBeenCalledWith(0);
  //       expect(mockNext).toHaveBeenCalledWith(1);
  //       done();
  //     },
  //   });
  //   jest.advanceTimersByTime(30);
  // });

  // // 6. debounce
  // test("debounce should emit last value after delay", (done) => {
  //   const stream = new RushStream<number>((observer) => {
  //     observer.next(0);
  //     observer.next(1);
  //     observer.next(2);

  //     setTimeout(() => {
  //       observer.complete();
  //     }, 100);
  //   });

  //   const mockNext = jest.fn();
  //   stream.debounce(10).listen({
  //     next: (value) => {
  //       mockNext(value);
  //     },
  //     complete: () => {
  //       expect(mockNext).toHaveBeenCalledTimes(1);
  //       expect(mockNext).toHaveBeenCalledWith(2);
  //       done();
  //     },
  //   });
  //   jest.advanceTimersByTime(30);
  // });

  // 7. pause/resume
  test("pause and resume should buffer and flush events", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
      observer.next(2);

      setTimeout(() => {
        observer.complete();
      }, 100);
    }, { useBuffer: true, maxBufferSize: 10 });

    const mockNext = jest.fn();
    stream.pause().listen({
      next: (value) => {
        mockNext(value);
      },
      complete: () => {
        expect(mockNext).toHaveBeenCalledTimes(2);
        expect(mockNext).toHaveBeenCalledWith(1);
        expect(mockNext).toHaveBeenCalledWith(2);
        done();
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
    stream.resume();
  });

  // 8. unlisten
  test("unlisten should stop the stream with complete", (done) => {
    const stream = new RushStream<number>((observer) => {
      observer.next(1);
    });

    const mockComplete = jest.fn();
    stream.listen({
      complete: () => {
        mockComplete();
        expect(mockComplete).toHaveBeenCalled();
        done();
      },
    });
    stream.unlisten('complete');
  });
});
