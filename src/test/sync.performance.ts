import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { RushStream } from "../stream/rush-stream"; // 실제 경로로 변경 필요

// 이벤트 수
const eventCount = 10_000_000_000; // 100억 이벤트

// 자원 사용량 측정 함수 (동기)
function measureResources(label: string, fn: () => void): void {
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB 단위
  const startCpu = process.cpuUsage(); // 마이크로초 단위
  const startTime = performance.now();

  fn();

  const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  const endCpu = process.cpuUsage(startCpu);
  const endTime = performance.now();

  const memoryUsed = endMemory - startMemory;
  const cpuUsed = (endCpu.user + endCpu.system) / 1000 / 1000; // 초 단위
  const duration = (endTime - startTime) / 1000; // 초 단위

  console.log(`${label}:`);
  console.log(`  Memory Used: ${memoryUsed.toFixed(2)} MB`);
  console.log(`  CPU Time: ${cpuUsed.toFixed(2)} seconds`);
  console.log(`  Ops/sec: ${(eventCount / duration).toFixed(0)} ops/sec`);
}

// RushStream - Simple Emission (동기)
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

// RushStream - Transformation (동기)
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

// RxJS - Simple Emission (동기)
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

// RxJS - Transformation (동기)
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

// 테스트 실행 (동기)
console.log("Starting benchmarks for 10 billion events...\n");

measureResources("RushStream - Simple Emission", testRushStreamSimple);
measureResources("RushStream - Transformation", testRushStreamTransform);
measureResources("RxJS - Simple Emission", testRxJSSimple);
measureResources("RxJS - Transformation", testRxJSTransform);

console.log("\nBenchmarks completed!");
