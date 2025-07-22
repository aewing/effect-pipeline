# Effect-Native Pipeline Improvements

This document summarizes the major improvements made to Effect Pipelines to better leverage Effect-TS capabilities while maintaining the excellent pipeline abstraction.

## ✨ Key Improvements

### 1. **Effect-Native Node Interface**

**Before:**
```typescript
interface Node<I, O> {
  run: (input: I) => Promise<O> | O
}
```

**After:**
```typescript
interface Node<I, O, E = never, R = never> {
  run: (input: I) => Effect.Effect<O, E, R>
}
```

**Benefits:**
- ✅ **Dependency Injection** - Nodes can access services from Effect context
- ✅ **Structured Error Handling** - Typed errors with proper propagation
- ✅ **Resource Management** - Automatic cleanup via Effect scopes
- ✅ **Observability** - Built-in tracing and debugging capabilities

### 2. **Enhanced Pipeline Executor**

The `PipelineExecutor` now:
- Preserves context requirements from all nodes
- Provides structured error handling with detailed context
- Emits proper runtime events for failures
- Maintains type safety throughout the pipeline

```typescript
// Automatically infers context requirements
const executor = new PipelineExecutor(pipeline, eventQueue);
const result = yield* executor.run<Database | Logger | ExternalApi>();
```

### 3. **Dependency Injection via Effect Layers**

```typescript
// Define services
class Database extends Context.Tag("Database")<Database, {
  readonly save: (data: unknown) => Effect.Effect<{ id: string }, never>
}>() {}

// Create implementations
const DatabaseLive = Layer.succeed(Database, {
  save: (data) => Effect.sync(() => ({ id: generateId() }))
});

// Provide to pipeline
const program = Effect.provide(pipelineExecution, DatabaseLive);
```

### 4. **Structured Error Handling**

**Custom Error Types:**
```typescript
class ValidationError extends Error {
  readonly _tag = "ValidationError";
  constructor(message: string, public readonly field: string) {
    super(message);
  }
}

class NetworkError extends Error {
  readonly _tag = "NetworkError"; 
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}
```

**Error Recovery:**
```typescript
pipe(
  executor.run(),
  Effect.catchAll((error) => {
    if (error.message.includes("NetworkError")) {
      return Effect.succeed("Retrying with fallback...");
    }
    return Effect.fail(error);
  })
)
```

## 🚀 Examples

### Basic Usage
```typescript
import { Effect } from "effect";
import { NodeKind, type Node } from "@effect-pipeline/core";

const simpleNode: Node<string, number> = {
  kind: NodeKind.Transform,
  name: "string-length",
  run: (input) => Effect.succeed(input.length)
};
```

### With Dependencies
```typescript
const databaseNode: Node<UserData, { id: string }, DatabaseError, Database> = {
  kind: NodeKind.Transform,
  name: "save-user",
  run: (input) => Effect.gen(function* (_) {
    const db = yield* _(Database);
    return yield* _(db.save(input));
  })
};
```

### Error Handling
```typescript
const validationNode: Node<Input, ValidatedInput, ValidationError> = {
  kind: NodeKind.Transform,
  name: "validate-input",
  run: (input) => {
    if (!input.email) {
      return Effect.fail(new ValidationError("Email required", "email"));
    }
    return Effect.succeed(input as ValidatedInput);
  }
};
```

## 📁 Updated Examples

### 1. `hello.pipeline.ts`
Basic example showing Effect-native nodes without dependencies.

### 2. `api.pipeline.ts` 
Demonstrates dependency injection with Database and Logger services.

### 3. `api-with-dependencies.ts`
Shows how to provide dependencies and run Effect-native pipelines.

### 4. `error-handling-demo.ts`
Comprehensive example of structured error handling with retry logic.

## 🔧 Migration Guide

### Updating Existing Nodes

**Old Style:**
```typescript
const oldNode: Node<Input, Output> = {
  kind: NodeKind.Transform,
  name: "old-transform",
  run: async (input) => {
    // async logic
    return result;
  }
};
```

**New Style:**
```typescript
const newNode: Node<Input, Output> = {
  kind: NodeKind.Transform, 
  name: "new-transform",
  run: (input) => Effect.gen(function* (_) {
    // Effect logic with dependency injection
    const service = yield* _(SomeService);
    return yield* _(service.process(input));
  })
};
```

### Providing Dependencies

```typescript
// Create layers for your services
const ServiceLayer = Layer.succeed(SomeService, implementation);

// Run pipeline with dependencies
const program = Effect.provide(
  pipelineExecution,
  ServiceLayer
);

Effect.runPromise(program);
```

## 🎯 Benefits Achieved

1. **Type Safety** - Complete type inference from input to output with error types
2. **Testability** - Easy mocking via Layer substitution  
3. **Composability** - Services can be shared across multiple pipelines
4. **Error Recovery** - Structured error handling with context information
5. **Resource Management** - Automatic cleanup and lifecycle management
6. **Observability** - Built-in tracing and event emission
7. **Performance** - Effect's optimized runtime with fiber-based concurrency

## 🔮 Future Enhancements

- **Concurrent Node Execution** - For independent operations
- **Schema Validation** - Runtime input/output validation with `@effect/schema`
- **Metrics Collection** - Built-in performance monitoring
- **Pipeline Composition** - Combining multiple pipelines
- **Streaming Data Support** - For large dataset processing

---

The pipeline abstraction remains clean and intuitive while gaining all the power of Effect-TS under the hood! 