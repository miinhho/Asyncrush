# Asyncrush

[![Coverage Status](https://coveralls.io/repos/github/miinhho/Asyncrush/badge.svg?branch=main)](https://coveralls.io/github/miinhho/Asyncrush?branch=main)
![Test Workflow](https://github.com/miinhho/Asyncrush/actions/workflows/test-flow.yml/badge.svg)
[![npm version](https://badge.fury.io/js/asyncrush.svg?v=3.0.0)](https://www.npmjs.com/package/asyncrush)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


**High Performance Middleware Streams** 🏎️

Asyncrush is a **high-performance stream processing library** that leverages the **middleware pattern** inspired by RxJS. Unlike traditional stream libraries, Asyncrush connects middleware using pure functions instead of operators, offering a **flexible, efficient, and scalable** approach to stream processing. It dramatically improves performance while minimizing memory usage, making it the ideal choice for high-throughput applications.

<br>

## ⚡ Key Features
- **Blazing Fast Performance**: Achieves up to **+89%** faster performance compared to traditional stream libraries.
- **Middleware-based Stream Control**: Process streams with middleware instead of operators, allowing for dynamic error handling, custom retry policies, and advanced state management.
- **Memory Efficiency**: Minimized object creation and small code size lead to significant reductions in memory consumption.
- **Developer-Friendly API**: The pure function-based API ensures that the library is easy to understand, use, and maintain.
- **Built-in Error Handling & Backoff**: Automatic error handling and backoff strategies allow for stable and resilient stream processing, even in the face of network or data failures.  

> Unpacked + Full feature code size : **111.5 kB**  

<br>

## 💾 Installation
```bash
npm install asyncrush
```
```bash
yarn add asyncrush
```
```bash
pnpm add asyncrush
```
```bash
bun install asyncrush
```

<br>

## ⌨️ Usage Example
```typescript
const stream = new RushStream<number>((observer) => {
  observer.next(1);
});

stream.use(
  (v: number) => v + 1,
  (v: number) => v * 2
).listen({
  next: (value) => {
    console.log(value);
  },
  complete: () => { },
});
```

<br>


## ⏱️ Benchmark

(10,000,000 events vs RxJS)
| Transforms | ops/sec      | How much faster            |
|------------|--------------|----------------------------|
| 200        | 612,033      | **+49%** ( > 409,546)      |
| 150        | 818,150      | **+52%** ( > 538,197)      |
| 100        | 1,205,331    | **+89%** ( > 636,078)      |
| 50         | 2,335,202    | **+60%** ( > 1,463,261)    |
| 25         | 4,535,603    | **+28%** ( > 3,547,165)    |
| 10         | 12,049,110   | **+32%** ( > 9,138,667)    |
| 5          | 20,226,773   | **+16%** ( > 17,410,811)   |

<br>

(1,000,000,000 events vs RxJS)
| Transforms | ops/sec      | How much faster             |
|------------|--------------|-----------------------------|
| 200        | 2,614,347    | **+67%** ( > 1,565,985)     |
| 150        | 3,346,151    | **+53%** ( > 2,179,874)     |
| 100        | 4,988,732    | **+47%** ( > 3,401,912)     |
| 50         | 9,333,233    | **+33%** ( > 7,029,017)     |
| 25         | 16,665,887   | **+23%** ( > 13,503,015)    |
| 10         | 40,911,683   | **+18%** ( > 34,761,997)    |
| 5          | 76,309,147   | **+14%** ( > 66,908,963)    |

Tested with randomly selected operators/middleware processes,
processing 1,000,000 batches from a total of 1 billion events, 10 million events
with operator selection based on `Math.random` values.

For reference, running the same operators/middleware repeatedly
can achieve up to 8x better performance due to JIT optimizations.
However, this benchmark intentionally minimizes JIT optimizations
to provide a more realistic, production-like performance measurement.

