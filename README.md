## Asyncrush

A lightweight, flexible TypeScript library for streaming and processing asynchronous events with ease.

<br>

**Inspired by RxJS**    

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

<br>

## Strengths
- **Flexibility in Async Processing**: Built for asynchronous event handling, Asyncrush excels in real-world scenarios like WebSocket streams or user interactions, offering built-in retry and buffering out of the box—features that often require additional setup in libraries like RxJS.

- **Type Versatility**: Supports dynamic type transformations within a single stream, making it easy to adapt data from one format to another (e.g., numbers to strings) without creating multiple streams.

- **Streamlined Middleware**: Integrates middleware directly within the stream, avoiding the need for separate stream instances, which reduces memory usage and boosts transformation performance

- **Customizable Retry Logic**: Offers a robust retry system with configurable delays, jitter, and maximum wait times, providing fine-grained control over error recovery without external dependencies.

- **Pause/Resume with Buffering**: Handles event bursts gracefully with built-in buffering, a feature not natively emphasized in many streaming libraries, enhancing reliability in unpredictable environments.

- **Throttle/Debounce**: Supports Throttle & Debounce system

<br>

## Installation
```
npm install asyncrush
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

## Benchmark
- Asyncrush:
  - **Transformation**: 327.42 seconds, 121,980,213 ops/sec
- RxJS:
  - **Transformation**: 439.36 seconds, 91,543,573 ops/sec

(Tested for 10,000,000,000 events)

- Asyncrush:
  - **Transformation**: 28.78 seconds, 140,262,103 ops/sec
- RxJS:
  - **Transformation**: 30.39 seconds, 131,429,866 ops/sec

(Tested for 1,000,000,000 events)

<br>

## Why Choose?
If you need a lightweight, TypeScript-native solution for managing **asynchronous event streams** with built-in retry, buffering, and type flexibility, Asyncrush is your go-to library. It balances performance and functionality, offering a simpler event-driven use cases.
