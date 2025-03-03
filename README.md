# Asyncrush

![Coverage](https://github.com/user-attachments/assets/b0f654d2-5220-4867-ac7e-d264eb071d84)
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

> [!Note]   
> Unpacked + Full feature code size : **35.7 kB**  

<br>

## 💾 Installation
```bash
npm install asyncrush
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
| Transforms | ops/sec      | How much faster|
|------------|--------------|----------------|
| 100        | 4,549,029    | **+80%**       |
| 50         | 8,041,039    | **+40%**       |
| 20         | 27,055,086   | **+54%**       |
| 10         | 43,926,787   | **+27%**       |
| 5          | 85,472,016   | **+25%**       |
| 2          | 167,830,565  | **+15%**       |

Tested with randomly selected operators/middleware processes,
processing 1,000,000 batches from a total of 1 billion events,
with operator selection based on `Math.random` values.

For reference, running the same operators/middleware repeatedly
can achieve up to 8x better performance due to JIT optimizations.
However, this benchmark intentionally minimizes JIT optimizations
to provide a more realistic, production-like performance measurement.

