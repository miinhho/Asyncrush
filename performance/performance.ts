import * as fs from 'fs';
import { performance } from "perf_hooks";
import { map, Observable, pipe } from "rxjs";
import { RushStream } from "../dist/lib";

const eventCount = 1_000_000_000;
const transformsCount = [
  // 5,
  // 10,
  // 25,
  // 50,
  // 100,
  // 150,
  200,
];
const iterationsPerTest = 3;

type ResourceUsage = {
  ops: string;
  opsNumeric: number;
  executionTimeSeconds: number;
  eventsPerSecond: number;
};

// Function to measure resource usage with more detailed metrics
function measureResources(label: string, fn: () => void): ResourceUsage {
  // Measure execution time
  const startTime = performance.now();
  fn();
  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000;

  // Calculate events per second (throughput)
  const eventsPerSecond = eventCount / duration;

  return {
    ops: eventsPerSecond.toFixed(0),
    opsNumeric: eventsPerSecond,
    executionTimeSeconds: duration,
    eventsPerSecond: eventsPerSecond,
  };
}

// Test function for AsyncRush transformation
function testAsyncRushTransform(transformCount: number, transformFnArray: [number, number]) {
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
  const transforms = Array.from({ length: transformCount }).map((_v, i) => {
    if (i < transformFnArray[0]) return transform1;
    else return transform2;
  });

  const transform1Count = transforms.filter(t => t === transform1).length;
  const transform2Count = transforms.filter(t => t === transform2).length;

  console.log(`  AsyncRush transform composition: ${transform1Count} add, ${transform2Count} multiply`);

  stream.use(
    ...transforms,
  ).listen({
    next: () => {},
    complete: () => {},
  });
}

function testRxJSTransform(transformCount: number, transformFnArray: [number, number]) {
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
  const transforms = Array.from({ length: transformCount }).map((_v, i) => {
    if (i < transformFnArray[0]) return transform1;
    else return transform2;
  });

  console.log(`  RxJS transform composition: ${transformFnArray[0]} add, ${transformFnArray[1]} multiply`);

  const piped = transforms.reduce(
    (acc, curr) => pipe(acc, curr),
    (x: Observable<number>) => x
  );

  piped(obs).subscribe({
    next: () => { },
    complete: () => { },
  });
}

type BenchmarkResult = {
  transformCount: number;
  asyncRush: ResourceUsage[];
  rxjs: ResourceUsage[];
};

const results: BenchmarkResult[] = [];

console.log("=".repeat(80));
console.log(`BENCHMARK CONFIGURATION:`);
console.log(`- Event count: ${eventCount.toLocaleString()}`);
console.log(`- Iterations per test: ${iterationsPerTest}`);
console.log(`- Transform counts to test: ${transformsCount.join(', ')}`);
console.log("=".repeat(80));

transformsCount.forEach((transformCount) => {
  console.log(`\nStarting benchmarks with ${transformCount} transformations...`);
  console.log("-".repeat(80));

  const asyncRushResults: ResourceUsage[] = [];
  const rxjsResults: ResourceUsage[] = [];

  for (let i = 0; i < iterationsPerTest; i++) {
    console.log(`\nIteration ${i + 1}/${iterationsPerTest}:`);
    const transformFnArray: [number, number] = [0, 0];
    for (let j = 0; j < transformCount; j++) {
      if (Math.random() < 0.5) transformFnArray[0]++;
      else transformFnArray[1]++;
    }

    console.log(`- Running AsyncRush with ${transformCount} transforms...`);
    const asyncRush = measureResources("AsyncRush - Transformation", () => {
      testAsyncRushTransform(transformCount, transformFnArray);
    });
    asyncRushResults.push(asyncRush);

    console.log(`- Running RxJS with ${transformCount} transforms...`);
    const rxjs = measureResources("RxJS - Transformation", () => {
      testRxJSTransform(transformCount, transformFnArray);
    });
    rxjsResults.push(rxjs);

    console.log(`\n  Results for iteration ${i + 1}:`);
    console.log(`  AsyncRush: ${asyncRush.ops} ops/sec, ${asyncRush.executionTimeSeconds.toFixed(2)}s`);
    console.log(`  RxJS: ${rxjs.ops} ops/sec, ${rxjs.executionTimeSeconds.toFixed(2)}s`);

    const perfDiff = ((asyncRush.opsNumeric / rxjs.opsNumeric) - 1) * 100;
    console.log(`  AsyncRush is ${perfDiff > 0 ? 'faster' : 'slower'} by ${Math.abs(perfDiff).toFixed(2)}%`);
  }

  results.push({
    transformCount,
    asyncRush: asyncRushResults,
    rxjs: rxjsResults
  });

  const asyncRushAvgOps = asyncRushResults.reduce((sum, r) => sum + r.opsNumeric, 0) / asyncRushResults.length;
  const rxjsAvgOps = rxjsResults.reduce((sum, r) => sum + r.opsNumeric, 0) / rxjsResults.length;
  const asyncRushAvgTime = asyncRushResults.reduce((sum, r) => sum + r.executionTimeSeconds, 0) / asyncRushResults.length;
  const rxjsAvgTime = rxjsResults.reduce((sum, r) => sum + r.executionTimeSeconds, 0) / rxjsResults.length;

  console.log(`\nAverage results for ${transformCount} transformations (${iterationsPerTest} iterations):`);
  console.log(`- AsyncRush: ${asyncRushAvgOps.toFixed(0)} ops/sec, ${asyncRushAvgTime.toFixed(2)}s=`);
  console.log(`- RxJS: ${rxjsAvgOps.toFixed(0)} ops/sec, ${rxjsAvgTime.toFixed(2)}s=`);

  const avgPerfDiff = ((asyncRushAvgOps / rxjsAvgOps) - 1) * 100;
  console.log(`- AsyncRush is ${avgPerfDiff > 0 ? 'faster' : 'slower'} by ${Math.abs(avgPerfDiff).toFixed(2)}%`);
  console.log("-".repeat(80));
});

console.log("\n" + "=".repeat(80));
console.log("BENCHMARK SUMMARY:");
console.log("=".repeat(80));

console.log("\nPerformance Comparison (Average Operations/Second):");
console.log("-".repeat(80));
console.log("| Transforms | AsyncRush (ops/s) | RxJS (ops/s) | Difference |");
console.log("|" + "-".repeat(11) + "|" + "-".repeat(19) + "|" + "-".repeat(14) + "|" + "-".repeat(12) + "|");

results.forEach(({ transformCount, asyncRush, rxjs }) => {
  const asyncRushAvg = asyncRush.reduce((sum, r) => sum + r.opsNumeric, 0) / asyncRush.length;
  const rxjsAvg = rxjs.reduce((sum, r) => sum + r.opsNumeric, 0) / rxjs.length;
  const diffPercent = ((asyncRushAvg / rxjsAvg) - 1) * 100;

  console.log(`| ${transformCount.toString().padEnd(10)} | ${asyncRushAvg.toFixed(0).padEnd(18)} | ${rxjsAvg.toFixed(0).padEnd(13)} | ${(diffPercent > 0 ? '+' : '') + diffPercent.toFixed(2) + '%'} |`);
});

console.log("-".repeat(80));

console.log("\nExecution Time Comparison (Seconds):");
console.log("-".repeat(80));
console.log("| Transforms | AsyncRush (s) | RxJS (s) | Difference |");
console.log("|" + "-".repeat(11) + "|" + "-".repeat(14) + "|" + "-".repeat(10) + "|" + "-".repeat(12) + "|");

results.forEach(({ transformCount, asyncRush, rxjs }) => {
  const asyncRushAvgTime = asyncRush.reduce((sum, r) => sum + r.executionTimeSeconds, 0) / asyncRush.length;
  const rxjsAvgTime = rxjs.reduce((sum, r) => sum + r.executionTimeSeconds, 0) / rxjs.length;
  const diffPercent = ((rxjsAvgTime / asyncRushAvgTime) - 1) * 100;

  console.log(`| ${transformCount.toString().padEnd(10)} | ${asyncRushAvgTime.toFixed(2).padEnd(13)} | ${rxjsAvgTime.toFixed(2).padEnd(9)} | ${(diffPercent > 0 ? '+' : '') + diffPercent.toFixed(2) + '%'} |`);
});

console.log("\nScalability Analysis (relative performance as transform count increases):");
console.log("-".repeat(80));

const baseTransformCount = transformsCount[0];
const baseAsyncRushOps = results[0].asyncRush.reduce((sum, r) => sum + r.opsNumeric, 0) / results[0].asyncRush.length;
const baseRxjsOps = results[0].rxjs.reduce((sum, r) => sum + r.opsNumeric, 0) / results[0].rxjs.length;

console.log("| Transforms | AsyncRush Scaling | RxJS Scaling | Difference |");
console.log("|" + "-".repeat(11) + "|" + "-".repeat(18) + "|" + "-".repeat(14) + "|" + "-".repeat(12) + "|");

results.forEach(({ transformCount, asyncRush, rxjs }) => {
  if (transformCount === baseTransformCount) {
    console.log(`| ${transformCount.toString().padEnd(10)} | 1.00x (baseline) | 1.00x (baseline) | baseline |`);
    return;
  }

  const asyncRushAvg = asyncRush.reduce((sum, r) => sum + r.opsNumeric, 0) / asyncRush.length;
  const rxjsAvg = rxjs.reduce((sum, r) => sum + r.opsNumeric, 0) / rxjs.length;

  const asyncRushScale = asyncRushAvg / baseAsyncRushOps;
  const rxjsScale = rxjsAvg / baseRxjsOps;

  const scaleDiff = ((asyncRushScale / rxjsScale) - 1) * 100;

  console.log(`| ${transformCount.toString().padEnd(10)} | ${asyncRushScale.toFixed(2)}x ${(asyncRushScale < 1 ? '↓' : '↑').padEnd(8)} | ${rxjsScale.toFixed(2)}x ${(rxjsScale < 1 ? '↓' : '↑').padEnd(4)} | ${(scaleDiff > 0 ? '+' : '') + scaleDiff.toFixed(2) + '%'} |`);
});

console.log("-".repeat(80));

const jsonResults = {
  config: {
    eventCount,
    transformsCount,
    iterationsPerTest,
    timestamp: new Date().toISOString()
  },
  results
};

const resultFilename = `benchmark-results-${new Date().toISOString().replace(/:/g, '-')}.json`;
fs.writeFileSync(resultFilename, JSON.stringify(jsonResults, null, 2));
console.log(`\nDetailed results saved to: ${resultFilename}`);

console.log("\nBenchmark Complete!");
