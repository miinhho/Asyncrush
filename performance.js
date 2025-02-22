const Benchmark = require("benchmark");
const { Observable } = require("rxjs");
const { map } = require("rxjs/operators");
const { EmitStream } = require("./dist/src/emiter/emit-stream");

// Benchmark suite
const suite = new Benchmark.Suite;

// Test data
const eventCount = 1_000_000_000;

// EmitStream: Simple emission
suite.add("EmitStream - Simple Emission", function (deferred) {
  const stream = new EmitStream((observer) => {
    let i = 0;
    const emit = () => {
      if (i < eventCount) observer.next(i++);
      else observer.complete();
    };
    process.nextTick(emit); // Start emission asynchronously
    return () => {};
  });
  stream.listen({
    next: () => {},
    complete: () => deferred.resolve(),
  });
});

// EmitStream: Transformation with middleware
suite.add("EmitStream - Transformation", function (deferred) {
  const stream = new EmitStream((observer) => {
    let i = 0;
    const emit = () => {
      if (i < eventCount) observer.next(i++);
      else observer.complete();
    };
    process.nextTick(emit);
    return () => {};
  });
  const mw = (v) => v + 1;
  stream.use(mw).listen({
    next: () => {},
    complete: () => deferred.resolve(),
  });
});

// RxJS: Simple emission
suite.add("RxJS - Simple Emission", function (deferred) {
  const obs = new Observable((subscriber) => {
    let i = 0;
    const emit = () => {
      if (i < eventCount) subscriber.next(i++);
      else subscriber.complete();
    };
    process.nextTick(emit);
  });
  obs.subscribe({
    next: () => {},
    complete: () => deferred.resolve(),
  });
});

// RxJS: Transformation
suite.add("RxJS - Transformation", function (deferred) {
  const obs = new Observable((subscriber) => {
    let i = 0;
    const emit = () => {
      if (i < eventCount) subscriber.next(i++);
      else subscriber.complete();
    };
    process.nextTick(emit);
  });
  obs.pipe(map((v) => v + 1)).subscribe({
    next: () => {},
    complete: () => deferred.resolve(),
  });
});

// Run the benchmarks
suite
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log("result " + this.filter("fastest").map("name"));
  })
  .run({ async: true });
