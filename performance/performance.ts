import { map, Observable, pipe } from "rxjs";
import { RushStream } from "../dist/lib";

const eventCount = 1_000_000_000;
const transformsCount = 100;

function measureResources(label: string, fn: () => void): void {
  console.log(`Starting ${label} with ${eventCount} events...`);
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  const startCpu = process.cpuUsage();
  const startTime = performance.now();

  fn();

  const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  const endCpu = process.cpuUsage(startCpu);
  const endTime = performance.now();

  const memoryUsed = endMemory - startMemory;
  const cpuUsed = (endCpu.user + endCpu.system) / 1000 / 1000;
  const duration = (endTime - startTime) / 1000;

  console.log(`${label}:`);
  console.log(`  Memory Used: ${memoryUsed.toFixed(2)} MB`);
  console.log(`  CPU Time: ${cpuUsed.toFixed(2)} seconds`);
  console.log(`  Ops/sec: ${((eventCount / duration) * 4).toFixed(0)} ops/sec`);
}

function testRushStreamTransform(transformCount: number) {
  const stream = new RushStream<number>((observer) => {
    const chunkSize = 1_000_000;
    for (let i = 0; i < eventCount; i += chunkSize) {
      for (let j = i; j < Math.min(i + chunkSize, eventCount); j++) {
        observer.next(j);
      }
    }
    observer.complete();
  });

  const transform = (v: number) => v + 1;
  const transforms = Array.from({ length: transformCount }, () => transform);

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

  const transform = map((v: number) => v + 1);
  const transforms = Array.from({ length: transformCount }, () => transform);

  const piped = transforms.reduce(
    (acc, curr) => pipe(acc, curr),
    (x: Observable<number>) => x
  );

  piped(obs).subscribe({
    next: (value) => { },
    complete: () => { },
  });
}

console.log(`Starting benchmarks with ${transformsCount} transformations...\n`);

measureResources("Asyncrush - Transformation", () => {
  testRushStreamTransform(transformsCount);
});
measureResources("RxJS - Transformation", () => {
  testRxJSTransform(transformsCount);
});

console.log("\nBenchmarks completed!");
