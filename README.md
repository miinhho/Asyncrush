## Asyncrush

A lightweight, flexible TypeScript library for streaming and processing asynchronous events with ease.

<br>

**Inspired from RxJS**    
This is **UNDER DEVELOPENT**  
Currently focused on features, so this is not a library at all  


<br>

## Features

- **Asynchronous Event Streaming**  
  Seamlessly handle streams of data from various sources, such as intervals, WebSockets, or DOM events, with a simple producer-based API.
  - Example: Create a stream emitting numbers every 100ms.
    ```typescript
    const stream = new RushStream<number>((observer) => {
      let i = 0;
      const id = setInterval(() => observer.next(i++), 100);
      return () => clearInterval(id);
    });
    ```

- **Type-Flexible Middleware**  
  Transform stream values with chained middleware functions supporting both synchronous and asynchronous operations, and allowing type changes (e.g., number to string).
  - Example: Apply transformations inline with flexible typing.
    ```typescript
    stream.use(
      [(v: number) => v + 1, async (v: number) => `${v} processed`],
      { retries: 2 }
    ).listen({ next: (v: string) => console.log(v) }); // "1 processed", "2 processed", ...
    ```

- **Retry Mechanism**  
  Automatically retry failed transformations with customizable backoff strategies, including exponential, linear, or user-defined delays  with jitter support for randomization.  
  - Example: Retry on failure with linear backoff.
    ```typescript
    stream.use([(v) => { if (Math.random() > 0.5) throw new Error(); return v; }], {
      retries: 3,
      retryDelay: 50,
      delayFn: (attempt, delay) => delay * (attempt + 1)
    });
    ```

- **Buffering and Pause/Resume**  
  Pause the stream to buffer events (up to a configurable maxBufferSize) and resume to process them, ideal for handling bursts or network delays.
  - Example: Pause and resume with buffering.
  ```typescript
  stream.pause();
  setTimeout(() => stream.resume(), 500); 
  // Buffers up to maxBufferSize, then flushes
  ```

- **Error Handling**  
  Continue streaming after errors with continueOnError, or handle them with a custom errorHandler, ensuring robust event processing.
  - Example: Continue despite errors.
  ```typescript
  stream.use(
    [(v) => { throw new Error("Fail"); }], 
    { continueOnError: true }
  );
  ```

- **Lightweight Design**
  Optimized with direct callback dispatching, reducing overhead while maintaining asynchronous capabilities.
  - Performance: ~922K ops/sec for simple emission, ~490K ops/sec with transformations (1B events).

<br>

## Strengths
- **Flexibility in Async Processing**: Built for asynchronous event handling, Asyncrush excels in real-world scenarios like WebSocket streams or user interactions, offering built-in retry and buffering out of the box—features that often require additional setup in libraries like RxJS.

- **Type Versatility**: Supports dynamic type transformations within a single stream, making it easy to adapt data from one format to another (e.g., numbers to strings) without creating multiple streams.

- **Streamlined Middleware**: Integrates middleware directly within the stream, avoiding the need for separate stream instances, which reduces memory usage and boosts transformation performance

- **Customizable Retry Logic**: Offers a robust retry system with configurable delays, jitter, and maximum wait times, providing fine-grained control over error recovery without external dependencies.

- **Pause/Resume with Buffering**: Handles event bursts gracefully with built-in buffering, a feature not natively emphasized in many streaming libraries, enhancing reliability in unpredictable environments.

<br>

## Installation
```
npm install (this is not library yet...)
```

<br>

## Usage Example
```typescript
const stream = new RushStream<number>((observer) => {
  let i = 0;
  const id = setInterval(() => observer.next(i++), 100);
  return () => clearInterval(id);
}, { maxBufferSize: 3 });

stream.use(
  [(v: number) => v + 1, async (v: number) => `${v} processed`],
  { retries: 2, retryDelay: 50 }
).listen({
  next: (v: any) => console.log(v),
  error: (e) => console.error(e),
});
```

<br>

## Strengths Compared to RxJS

Asyncrush stands out as a lightweight, efficient alternative to RxJS, offering unique advantages while maintaining robust asynchronous event streaming capabilities. Here’s how it compares:

- **Superior Transformation Performance**: Asyncrush outperforms RxJS in transformation tasks, achieving ~482K ops/sec compared to RxJS’s ~442K ops/sec (9% faster) in benchmarks with 1 billion events. This edge comes from optimized synchronous pathways and minimized overhead, making it ideal for real-time data processing.

- **Resource Efficiency**: With a minified bundle size of just < 8KB (versus RxJS’s ~30KB), Asyncrush reduces memory footprint and eliminates external dependencies. Its design avoids unnecessary object creation, delivering better memory efficiency than RxJS.

- **Lightweight and Focused**: Unlike RxJS, which includes dozens of operators and a steeper learning curve, Asyncrush provides a streamlined API tailored for core streaming needs—such as retries, buffering, and type transformations—without the bloat. This makes it perfect for lightweight applications like IoT or browser-based real-time updates.

- **Simplicity Meets Power**: Built from scratch, Asyncrush proves that simplicity doesn’t sacrifice capability. It matches or exceeds RxJS in key areas while staying intuitive, offering a practical alternative for developers seeking efficiency without complexity.

### Benchmarks (10 Billion Events)
- **RushStream - Simple Emission**: 1,082,298 ops/sec – Beats RxJS (~4% faster than 1,040,195 ops/sec).
- **RushStream - Transformation**: 589,897 ops/sec – Outperforms RxJS (~29% faster than 455,813 ops/sec).

<br>

## Why Choose?
If you need a lightweight, TypeScript-native solution for managing **asynchronous event streams** with built-in retry, buffering, and type flexibility, Asyncrush is your go-to library. It balances performance and functionality, offering a simpler event-driven use cases.
