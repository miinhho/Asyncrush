## RxJS from scratch - with EventEmitter

### Reactive programming with Node.js's EventEmitter

**Inspired from RxJS**    
This is **NOT FOR PRODUCTION**  
Currently focused on features, so this is not a library at all  

<br>
I made this for study  
To understand reactive programming more deeply  

<br>

---

### Features

- Basic Event Stream
```typescript
const values: number[] = [];

const sourceStream = new EmitStream<number>((observer) => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.complete();

  return () => { };
});

sourceStream.listen({
  next: (value) => values.push(value),
  complete: () => {
    console.log(value);
  }
});
```

- Map operator
```typescript
const results: number[] = [];

new EmitStream<number>((observer) => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.complete();

  return () => { };
}).pipe(
  map((value) => value * 2)
).listen({
  next: (value) => results.push(value),
  complete: () => {
    console.log(results);
  });
```
