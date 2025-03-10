# Change Log

## [3.0.0] (2025-03-06)

### 👻 Utility patch!!  
- `combineLatest`, `createStream`, `mergeStream`, `withBuffer`, `withDelay`, `withInterval` - for `RushStream`.  
- `fromDomEvent`, `fromEmitter`, `fromPromise`, `fromValues` - for data streaming.  
- `setBackpressure` - for handle Backpressure with ease.  
- `createSubscriber` - for `RushSubscriber`.   

### 🛠️ Fix:  
- Remove Jest test coverage number, because it is not very accurate.  

### ✨ New feature:
- Backpressure.  
- Object Pool.  
- Bunch of utility functions to get / handle stream.  

### 🔧 Improvements:
- Lot of test case added (159 Tests).  
- Unpacked size changed to `128.5 kB`.  
- Optimize `RushObserver`.  
- Improve readability of code.  
- Modify performance test to be more realistic.  

### Contributors
- [miinhho](https://github.com/miinhho)

<br>

## [2.2.1] (2025-03-06)

### 🛠️ Fix:  
- Module path error in `RushStream`, `RushSubscriber`, `from-events`.  

### ✨ New feature:

### 🔧 Improvements:
- Test case added. 97.64% test coverage achieved.  
- Unpacked size changed to `46.5 kB`.  
- Code comment added.  

### Contributors
- [miinhho](https://github.com/miinhho)

<br>

## [2.2.0] (2025-03-06)

### 🛠️ Fix:  
- `streamFromTarget`, `streamFromTargets`, `streamFromEvents`, `streamFromEvent` bug fix.  
- `RushDebugHook.onEmit` bug fix.  
- `streamFromDynamicTargets` is not supported.  

### ✨ New feature:
- `RushSubscriber` supports debounce & throttle.  
- `mergeStream` for merge multiple streams.  

### 🔧 Improvements:
- Test case added. 97.38% test coverage achieved.  
- Unpacked size changed to `45.9 kB`.  
- Some test case error fixed -> now all test case is working fine.  

### Contributors
- [miinhho](https://github.com/miinhho)

<br>

## [2.1.0] (2025-03-06)

### 🛠️ Fix:  

### ✨ New feature:
- `streamFromTarget` now gets [`AddEventListenerOptions`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#options) to handle Web API better.  
- `streamFromTargets`, `streamFromDynamicTargets`, `streamFromEvents` are added to make stream with multiple events.   

### 🔧 Improvements:
- Test case added. 97.87% test coverage achieved.  
- Unpacked size changed to `42.2 kB`.  
- Add a comment to that didn't have a comment.   

### Contributors
- [miinhho](https://github.com/miinhho)

<br>

## [2.0.0] (2025-03-06)

### Convenience patch!!  
- Now you can get a stream from event that extends `Event` or `EventEmitter`.   

### 🛠️ Fix:

### ✨ New feature:
- `streamFromTarget`, `streamFromEvent` for getting stream from event.  

### 🔧 Improvements:
- Test case added. 97.19% test coverage achieved.  
- Unpacked size changed to `36.0 kB`.  
- Refactor to make it easier to maintain.  

### Contributors
- [miinhho](https://github.com/miinhho)

<br>

## [1.3.1] (2025-03-05)

### 🛠️ Fix:
- Middleware next to promise middleware error handling issue fixed.  
- `RushMiddlewareOption` is now integrated with `RushUseOption`.  

### ✨ New feature:

### 🔧 Improvements:
- Test case added. 98.23% test coverage achieved.  
- unpacked size changed to `34.1 kB`.  

### Contributors
- [miinhho](https://github.com/miinhho)

<br>

## [1.3.0] (2025-03-04)

### 🛠️ Fix:
- Changed property initialization from `null` to `?` to make it more null safe.

### ✨ New feature:
- `RushDebugHook` for debugging stream events and lifecycle stages.

### 🔧 Improvements:
- Test case added. 95.69% test coverage achieved.
- Improved code stability.  

### Contributors
- [miinhho](https://github.com/miinhho)

<br>


## [1.2.2] (2025-03-01)

### 🛠️ Fix:
- `RushSubscriber.use` using `RushListenOption` -> `RushSubscriberOption`

### ✨ New feature:
- `RushSubscriber` now catch completion in `RushStream`.
- Unsubscribe multiple subscribers at once by `RushStream.unsubscribe`.

### 🔧 Improvements:
- Test case added. 91% test coverage achieved.

### Contributors
- [miinhho](https://github.com/miinhho)

<br>


###

## [1.2.1] (2025-03-01)

### 🛠️ Fix:
- Error handling in middleware has been improved.

### ✨ New feature:
- `RushSubscriber` now supports multicast.

### 🔧 Improvements:
- Error handling is now more stable, with 88.85% test coverage achieved.
- Performance has been significantly improved.

### Contributors
- [miinhho](https://github.com/miinhho)

<br>

## [1.1.2](https://github.com/miinhho/Asyncrush/releases/tag/1.1.2) (2025-02-26)

### Big Fix:  
- some weren't removed observer complete  

### Improved:  
- subscriber handling  
- stream unlisten  

### Contributors
- [miinhho](https://github.com/miinhho)

<br>


## [1.1.1](https://github.com/miinhho/Asyncrush/releases/tag/1.1.1) (2025-02-25)

Core features are provided reliably  

### Contributors
- [miinhho](https://github.com/miinhho)
