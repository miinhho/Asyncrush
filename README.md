## Stream Emitter

### Reactive programming with Node.js's EventEmitter

#### Event-driven middleware for effective & clear  

<br>

**Inspired from RxJS**    
This is **NOT FOR PRODUCTION**  
Currently focused on features, so this is not a library at all  

<br>


## Features

```typescript
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
  .then((middleware) => {
    middleware.listen(listenStream)
  });

setTimeout(() => {
  stream.unlisten('complete');
}, 1000);
```
