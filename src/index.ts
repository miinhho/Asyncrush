import { EmitObserveStream } from "@emiter/emit-observer.types";
import { EmitStream } from "@emiter/emit-stream";
import { useMiddleware } from "@middleware/use-middleware";

const stream = new EmitStream((observer) => {
  observer.next('Hello');
  observer.next('World');
  observer.complete();

  return () => {
    console.log('Completed');
  };
});

const middleware = useMiddleware((value) => {
  return value + ' Middlewared';
});

const listenStream: EmitObserveStream = {
  next: (value) => console.log(value + ' Listened'),
  error: (error) => console.error(error),
  complete: () => console.log('Completed')
};

stream
  .use(middleware)
  .then((middleware) => middleware.listen(listenStream));

setTimeout(() => {
  stream.unlisten('complete');
}, 1000);
