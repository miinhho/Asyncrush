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

![benchmark](https://github.com/user-attachments/assets/39b8a7a4-5406-4c01-90a3-57c90a24d475)

(Tested for 1,000,000,000 events)
| Transforms | Library   | CPU Time  | ops/sec              |
|------------|------------|-----------|----------------------|
| 30         | Asyncrush  | 234.33    | 17,078,180           |
| 30         | RxJS       | 413.61    | 9,664,657            |
| 20         | Asyncrush  | 130.77    | 30,587,295           |
| 20         | RxJS       | 247.41    | 16,148,560           |
| 10         | Asyncrush  | 69.48     | 57,581,176           |
| 10         | RxJS       | 116.23    | 34,362,595           |
| 6          | Asyncrush  | 44.75     | 90,102,085           |
| 6          | RxJS       | 70.67     | 56,685,668           |
| 2          | Asyncrush  | 28.78     | 140,262,103          |
| 2          | RxJS       | 30.39     | 131,429,866          |

