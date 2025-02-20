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
```
