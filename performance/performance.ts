import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { RushStream } from "../dist/lib";
const eventCount = 1_000_000_000;

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

function testRushStreamTransform() {
  const stream = new RushStream<number>((observer) => {
    const chunkSize = 1_000_000;
    for (let i = 0; i < eventCount; i += chunkSize) {
      for (let j = i; j < Math.min(i + chunkSize, eventCount); j++) {
        observer.next(j);
      }
    }
    observer.complete();
    return () => {};
  });

  stream.use(
    (v: number) => v + 1,
    (v: number) => v * 2,  // 2
    (v: number) => v + 1,
    (v: number) => v * 2,
    (v: number) => v + 1,
    (v: number) => v * 2,  // 6
    // (v: number) => v + 1,
    // (v: number) => v * 2,
    // (v: number) => v + 1,
    // (v: number) => v * 2,  // 10
    // (v: number) => v + 1,
    // (v: number) => v * 2,
    // (v: number) => v + 1,
    // (v: number) => v * 2,
    // (v: number) => v + 1,
    // (v: number) => v * 2,
    // (v: number) => v + 1,
    // (v: number) => v * 2,
    // (v: number) => v + 1,
    // (v: number) => v * 2,  // 20
    // (v: number) => v * 2,
    // (v: number) => v + 1,
    // (v: number) => v * 2,
    // (v: number) => v + 1,
    // (v: number) => v * 2,
    // (v: number) => v * 2,
    // (v: number) => v + 1,
    // (v: number) => v * 2,
    // (v: number) => v + 1,
    // (v: number) => v * 2,  // 30
  ).listen({
    next: () => {},
    complete: () => {},
  });
}

function testRxJSTransform() {
  const obs = new Observable<number>((subscriber) => {
    const chunkSize = 1_000_000;
    for (let i = 0; i < eventCount; i += chunkSize) {
      for (let j = i; j < Math.min(i + chunkSize, eventCount); j++) {
        subscriber.next(j);
      }
    }
    subscriber.complete();
  });

  obs.pipe(
    map((v: number) => v + 1),
    map((v: number) => v * 2),  // 2
    map((v: number) => v + 1),
    map((v: number) => v * 2),
    map((v: number) => v + 1),
    map((v: number) => v * 2),  // 6
    // map((v: number) => v + 1),
    // map((v: number) => v * 2),
    // map((v: number) => v + 1),
    // map((v: number) => v * 2),  // 10
    // map((v: number) => v + 1),
    // map((v: number) => v * 2),
    // map((v: number) => v + 1),
    // map((v: number) => v * 2),
    // map((v: number) => v + 1),
    // map((v: number) => v * 2),
    // map((v: number) => v + 1),
    // map((v: number) => v * 2),
    // map((v: number) => v + 1),
    // map((v: number) => v * 2),  // 20
    // map((v: number) => v * 2),
    // map((v: number) => v + 1),
    // map((v: number) => v * 2),
    // map((v: number) => v + 1),
    // map((v: number) => v * 2),
    // map((v: number) => v * 2),
    // map((v: number) => v + 1),
    // map((v: number) => v * 2),
    // map((v: number) => v + 1),
    // map((v: number) => v * 2),  // 30
  ).subscribe({
    next: () => {},
    complete: () => {},
  });
}

console.log("Starting async benchmarks...\n");

measureResources("Asyncrush - Transformation", testRushStreamTransform);
measureResources("RxJS - Transformation", testRxJSTransform);

console.log("\nAsync Benchmarks completed!");
