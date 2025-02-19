## Stream Emitter

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
