# Contributing

I really appreciate ❤️ your willingness to contribute to this project.  
If you don't mind, I would appreciate 😘 it if you would read the guide below.  

<br>

## Code Style

### Language and Tools
- Use **TypeScript** with generics for type safety and flexibility.  
- Leverage modern ES6+ features (arrow functions, optional chaining, etc...) where appropriate.  

### Naming Conventions
- **Classes, Interfaces, and Types**: Use PascalCase.  
- **Methods, Variables, and Properties**: Use camelCase.  
- **Private Members**: Marked with the `private` keyword, no underscores.   

### Comments
- Use **JSDoc** comments for all classes, interfaces, methods, and properties.  
- Include:
  - A brief description of purpose  
  - `@param` for parameters with type and description.  
  - `@template` for generic types.  
  - `@returns` if applicable.  
- Example:
```typescript
/**
 * Processes incoming data and emits it to listeners
 * @param data - The data to process
 */
processData(data: T): void {
  this.next(data);
}
```

### Structure and Formatting
- Use 2 spaces for indentation.  
- Use single-line conditionals without braces for simple statements.  
- Group related methods logically (e.g., public API, event handling, utilities).  
- Avoid excessive whitespace; keep code concise but readable.

### Design and Implementation
- Favor **functional programming** principles: avoid mutating state directly, use chained or composed functions.  
- Support **chaining** for event handlers, as seen in the `on` method, rather than arrays of callbacks.  
- Include lifecycle methods (e.g., `destroy`, `cleanup`) to manage resources.  
- Make features configurable via constructor options (e.g., `{ continueOnError?: boolean }`).  

### Error Handling
- Handle errors explicitly and provide options for continuation (e.g., `continueOnError`).  
- Ensure null safety by checking for handler existence before invocation.  

<br><br>

## Commit Messages
Please follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)  

<br>

## Testing
Please update the tests to reflect your code changes.  

<br>

## Documentation
Please update the [docs](https://github.com/miinhho/Asyncrush/wiki) accordingly so that there are no discrepancies between the API and the documentation.  

<br>

## Developing
- `npm run test` run the jest tests
- `npm run build` build the source

<br>

## Performance
Please run `performance/performance.ts` and include changes between your code changes.  

Because we're focused on performance, it can be difficult to add features that have a significant impact on performance.  
