import { EmitObserveStream } from "@emiter/emit-observer.types";
import { EmitStream } from "@emiter/emit-stream";
import { useMiddleware } from "@middleware/use-middleware";

const stream = new EmitStream((observer) => {
  let count = 0;
  const interval = setInterval(() => {
    observer.next(count);
    count++;

    if (count > 5) {
      observer.complete();
      clearInterval(interval);
    }
  }, 10);

  return () => {
    clearInterval(interval);
    console.log('Cleanup');
  };
});

const middleware = useMiddleware((value) => {
  return value + 1;
});

const listenStream: EmitObserveStream = {
  next: (value) => console.log(value),
  error: (error) => console.error(error),
  complete: () => console.log('Completed')
};

stream
  .use(middleware)
  .listen(listenStream);

setTimeout(() => {
  stream.unlisten('complete');
}, 100);
