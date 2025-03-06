# Asyncrush

![Coverage](https://github.com/user-attachments/assets/b44d0033-e9a4-41ba-9c9f-0c8c95a5125d)
![Test Workflow](https://github.com/miinhho/Asyncrush/actions/workflows/test-flow.yml/badge.svg)  


**High Performance Middleware Streams** 🏎️

Asyncrush is a **high-performance stream processing library** that leverages the **middleware pattern** inspired by RxJS. Unlike traditional stream libraries, Asyncrush connects middleware using pure functions instead of operators, offering a **flexible, efficient, and scalable** approach to stream processing. It dramatically improves performance while minimizing memory usage, making it the ideal choice for high-throughput applications.

<br>

## ⚡ Key Features
- **Blazing Fast Performance**: Achieves up to 80% faster performance compared to traditional stream libraries.
- **Middleware-based Stream Control**: Process streams with middleware instead of operators, allowing for dynamic error handling, custom retry policies, and advanced state management.
- **Memory Efficiency**: Minimized object creation and small code size lead to significant reductions in memory consumption.
- **Developer-Friendly API**: The pure function-based API ensures that the library is easy to understand, use, and maintain.
- **Built-in Error Handling & Backoff**: Automatic error handling and backoff strategies allow for stable and resilient stream processing, even in the face of network or data failures.  

> Unpacked + Full feature code size : **46.5 kB**  

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

(1,000,000,000 events vs RxJS)
| Transforms | ops/sec      | How much faster             |
|------------|--------------|-----------------------------|
| 500        | 842,264      | **+97%** ( > 427,199)       |
| 100        | 4,003,148    | **+67%** ( > 2,399,334)     |
| 50         | 9,247,420    | **+65%** ( > 5,598,080)     |
| 20         | 25,015,393   | **+52%** ( > 16,480,655)    |
| 10         | 45,197,591   | **+35%** ( > 33,504,634)    |
| 5          | 68,988,635   | **+3%** ( > 67,257,982)     |

Tested with randomly selected operators/middleware processes,
processing 1,000,000 batches from a total of 1 billion events,
with operator selection based on `Math.random` values.

For reference, running the same operators/middleware repeatedly
can achieve up to 8x better performance due to JIT optimizations.
However, this benchmark intentionally minimizes JIT optimizations
to provide a more realistic, production-like performance measurement.

