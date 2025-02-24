import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { RushStream } from "../stream/rush-stream";

const eventCount = 10_000_000_000;

function measureResources(label: string, fn: () => void): void {
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
  console.log(`  Ops/sec: ${(eventCount / duration).toFixed(0)} ops/sec`);
}

function testRushStreamSimple() {
  const stream = new RushStream<number>((observer) => {
    for (let i = 0; i < eventCount; i++) {
      observer.next(i);
    }
    observer.complete();
    return () => {};
  }, { maxBufferSize: 1000 });

  stream.listen({
    next: () => {},
    complete: () => {},
  });
}

function testRushStreamTransform() {
  const stream = new RushStream<number>((observer) => {
    for (let i = 0; i < eventCount; i++) {
      observer.next(i);
    }
    observer.complete();
    return () => {};
  }, { maxBufferSize: 1000 });

  stream.use(
    (v: number) => v + 1,
    (v: number) => v * 2
  ).listen({
    next: () => {},
    complete: () => {},
  });
}

function testRxJSSimple() {
  const obs = new Observable<number>((subscriber) => {
    for (let i = 0; i < eventCount; i++) {
      subscriber.next(i);
    }
    subscriber.complete();
  });

  obs.subscribe({
    next: () => {},
    complete: () => {},
  });
}

function testRxJSTransform() {
  const obs = new Observable<number>((subscriber) => {
    for (let i = 0; i < eventCount; i++) {
      subscriber.next(i);
    }
    subscriber.complete();
  });

  obs.pipe(
    map((v: number) => v + 1),
    map((v: number) => v * 2)
  ).subscribe({
    next: () => {},
    complete: () => {},
  });
}

console.log("Starting benchmarks for 10 billion events...\n");

measureResources("RushStream - Simple Emission", testRushStreamSimple);
measureResources("RushStream - Transformation", testRushStreamTransform);
measureResources("RxJS - Simple Emission", testRxJSSimple);
measureResources("RxJS - Transformation", testRxJSTransform);

console.log("\nBenchmarks completed!");
