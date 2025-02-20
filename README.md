## RxJS from scratch - with EventEmitter

### Reactive programming with Node.js's EventEmitter

**Inspired from RxJS**    
This is **NOT FOR PRODUCTION**  
Currently focused on features, so this is not a library at all  

<br>
I made this for study  
To understand reactive programming more deeply  

<br>


## Features

**- Basic Event Stream**
```typescript
const stream = new EmitStream<number>((observer) => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.complete();

  return () => console.log('Cleanup');
});

stream.listen({
  next: (value) => console.log(value),
  complete: () => console.log('Complete')
});
```

<br>


**- `useMiddleware`**
```typescript
const stream = new EmitStream<number>((observer) => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.complete();

  return () => console.log('Cleanup');
});

(async () => {
  const middlewares = await stream.use(
    useMiddleware((value: number) => value * 2),
    useMiddleware((value: number) => value + 1),
    useMiddleware((value: number) => value * 3)
  );

  middlewares.listen({
    next: (value) => console.log(value),
    error: (err) => console.error(err),
    complete: () => console.log('Complete')
  });
})();
```

<br>


**- `unlisten`**
```typescript
const stream = new EmitStream<number>((observer) => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.complete();

  return () => {
    console.log('Cleanup');
  };
});

const exampleMiddleware = useMiddleware((value: number) => {
  console.log('Middleware called');
  return value * 2;
});

stream.use(exampleMiddleware).then((middleware) => {
  const listener = middleware.listen({
    next: (value) => console.log(value),
    complete: () => console.log('Complete')
  });

  setTimeout(() => {
    listener.unlisten();
    console.log('Unsubscribed');
  }, 2000);
});
```
