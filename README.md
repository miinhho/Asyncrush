# Asyncrush

**High Performance Middleware Streams** 🏎️

Asyncrush is a **high-performance stream processing library** that leverages the **middleware pattern** inspired by RxJS. Unlike traditional stream libraries, Asyncrush connects middleware using pure functions instead of operators, offering a **flexible, efficient, and scalable** approach to stream processing. It dramatically improves performance while minimizing memory usage, making it the ideal choice for high-throughput applications.

<br>

## ⚡ Key Features
- **Blazing Fast Performance**: Achieves up to 2x faster performance compared to traditional stream libraries.
- **Middleware-based Stream Control**: Process streams with middleware instead of operators, allowing for dynamic error handling, custom retry policies, and advanced state management.
- **Memory Efficiency**: Minimized object creation and small code size lead to significant reductions in memory consumption.
- **Developer-Friendly API**: The pure function-based API ensures that the library is easy to understand, use, and maintain.
- **Built-in Error Handling & Backoff**: Automatic error handling and backoff strategies allow for stable and resilient stream processing, even in the face of network or data failures.

> [!Note]   
> Unpacked + Full feature code size : **32.7 kB**  

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

![benchmark](https://github.com/user-attachments/assets/e23d597d-f0d3-4946-9263-a37148fe5fb6)

(Tested for 1,000,000,000 events)
| Transforms | Library    | CPU Time  | ops/sec              |
|------------|------------|-----------|----------------------|
| 100        | Asyncrush  | 164.34    | 24,303,961           |
| 100        | RxJS       | 1382.41   | 2,888,290            |
| 50         | Asyncrush  | 95.83     | 41,697,872           |
| 50         | RxJS       | 570.45    | 6,994,585            |
| 30         | Asyncrush  | 62.23     | 64,330,462           |
| 30         | RxJS       | 323.44    | 12,326,413           |
| 20         | Asyncrush  | 48.53     | 82,466,609           |
| 20         | RxJS       | 209.23    | 19,084,753           |
| 10         | Asyncrush  | 34.88     | 114,760,479          |
| 10         | RxJS       | 108.23    | 36,885,747           |
| 6          | Asyncrush  | 29.36     | 135,840,204          |
| 6          | RxJS       | 66.03     | 60,424,832           |
| 2          | Asyncrush  | 24.36     | 164,219,864          |
| 2          | RxJS       | 27.05     | 147,904,265          |

