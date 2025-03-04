# Change Log

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
