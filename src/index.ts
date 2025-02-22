import { EmitStream } from "@emiter/emit-stream";

const stream = new EmitStream<number>((observer) => {
  let i = 0;
  const id = setInterval(() => observer.next(i++), 100);
  return () => clearInterval(id);
}, { maxBufferSize: 3 });

stream.use(
  [(v: number) => v + 1, (v: number) => Promise.resolve(v + 2)],
  {
    retries: 2,
    retryDelay: 50,
    maxRetryDelay: 1000,
    jitter: 0.1,
    continueOnError: true,
    delayFn: (attempt, baseDelay) => baseDelay * Math.pow(2, attempt)
  }
).listen({
  next: (v) => console.log(v),
  error: (e) => console.error(e),
});
