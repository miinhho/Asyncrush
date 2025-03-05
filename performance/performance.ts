import { map, Observable, pipe } from "rxjs";
import { RushStream } from "../dist/lib";

const eventCount = 1_000_000_000;
const transformsCount = [
  2,
  5,
  10,
  20,
  50,
  100,
  500,
];

type ResourceUsage = {
  ops: string;
};

function measureResources(label: string, fn: () => void): ResourceUsage {
  const startTime = performance.now();
  fn();
  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000;

  return {
    ops: ((eventCount / duration) * 4).toFixed(0),
  };
}

function testAsyncRushTransform(transformCount: number) {
  const stream = new RushStream<number>((observer) => {
    const chunkSize = 1_000_000;
    for (let i = 0; i < eventCount; i += chunkSize) {
      for (let j = i; j < Math.min(i + chunkSize, eventCount); j++) {
        observer.next(j);
      }
    }
    observer.complete();
  });

  const transform1 = (v: number) => v + 1;
  const transform2 = (v: number) => v * 2;
  const transforms = Array.from({ length: transformCount }).map(() => {
    if (Math.random() < 0.5) {
      return transform1;
    }
    return transform2;
  });

  stream.use(
    ...transforms,
  ).listen({
    next: () => {},
    complete: () => {},
  });
}

function testRxJSTransform(transformCount: number) {
  const obs = new Observable<number>((subscriber) => {
    const chunkSize = 1_000_000;
    for (let i = 0; i < eventCount; i += chunkSize) {
      for (let j = i; j < Math.min(i + chunkSize, eventCount); j++) {
        subscriber.next(j);
      }
    }
    subscriber.complete();
  });

  const transform1 = map((v: number) => v + 1);
  const transform2 = map((v: number) => v * 2);
  const transforms = Array.from({ length: transformCount }).map(() => {
    if (Math.random() < 0.5) {
      return transform1;
    }
    return transform2;
  });

  const piped = transforms.reduce(
    (acc, curr) => pipe(acc, curr),
    (x: Observable<number>) => x
  );

  piped(obs).subscribe({
    next: (value) => { },
    complete: () => { },
  });
}


const asyncrushResults: Map<number, ResourceUsage> = new Map();
const rxjsResults: Map<number, ResourceUsage> = new Map();

transformsCount.forEach((transformCount) => {
  console.log(`Starting benchmarks with ${transformCount} transformations...\n`);

  const asyncrush = measureResources("Asyncrush - Transformation", () => {
    testAsyncRushTransform(transformCount);
  });
  const rxjs = measureResources("RxJS - Transformation", () => {
    testRxJSTransform(transformCount);
  });

  asyncrushResults.set(transformCount, asyncrush);
  rxjsResults.set(transformCount, rxjs);

  console.log(`Benchmarks with ${transformCount} transformations done!\n`);
});

console.log("Results:");
console.log("Asyncrush:");
asyncrushResults.forEach((value, key) => {
  console.log(`${key} transforms: ${value.ops} ops/sec`);
});

console.log("RxJS:");
rxjsResults.forEach((value, key) => {
  console.log(`${key} transforms: ${value.ops} ops/sec`);
});

console.log("Benchmark Complete!");
