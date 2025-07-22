# Effect Pipeline - Semantic API Examples

The **Semantic API** makes Effect Pipeline accessible to developers who aren't familiar with Effect-TS patterns like generators, complex type signatures, and Context management.

## 🎯 **Vision: From Complex to Simple**

### **Current (Effect-Native) API**
```typescript
// Complex - requires Effect expertise
const node: Node<Input, Output, Error, Context> = {
  kind: NodeKind.Transform,
  name: "process-data",
  run: (input) => Effect.gen(function* (_) {
    const database = yield* _(Database);
    const result = yield* _(database.query("SELECT * FROM users"));
    return { processed: result };
  })
};

const pipeline = PipelineBuilder("my-pipeline")
  .from(ingressNode)
  .through(transformNode)
  .to(egressNode)
  .build();

const executor = new PipelineExecutor(pipeline, eventQueue);
yield* _(executor.run());
```

### **Semantic API - Intuitive & Familiar**
```typescript
// Simple - feels like regular async/await
const processData = transform("process-data", async (input, { database }) => {
  const result = await database.query("SELECT * FROM users");
  return { processed: result };
});

const pipeline = pipeline("my-pipeline")
  .with(database)
  .start(ingress)
  .then(processData)
  .end(egress);

await run(pipeline);
```

## 🚀 **Key Benefits**

### **1. Intuitive Node Creation**
- ✅ **Simple functions** instead of complex interfaces
- ✅ **async/await** instead of Effect generators
- ✅ **Regular Promise patterns** that developers know

### **2. Automatic Dependency Injection**
- ✅ **Services passed as parameters** - no Context.Tag complexity
- ✅ **Type-safe service access** without Effect knowledge
- ✅ **Intuitive `.with()` syntax** for providing dependencies

### **3. Built-in Concurrency**
- ✅ **`concurrent()` helper** instead of Effect.all()
- ✅ **Automatic parallelization** of independent operations
- ✅ **Simple object syntax** for concurrent execution

### **4. Familiar Error Handling**
- ✅ **Standard try/catch** patterns
- ✅ **Regular Error classes** instead of Effect's tagged unions
- ✅ **Promise-based error propagation**

## 📁 **Examples**

### **[hello.semantic.ts](./hello.semantic.ts)**
Basic pipeline showing simple node creation and execution.

**Key Features:**
- Simple ingress/transform/egress pattern
- Intuitive pipeline building
- Promise-based execution

### **[api.semantic.ts](./api.semantic.ts)**
Advanced example with dependency injection and error handling.

**Key Features:**
- Service injection with `.with()`
- Structured error handling
- Validation and database operations

### **[concurrency.semantic.ts](./concurrency.semantic.ts)**
Demonstrates Effect's powerful concurrency in a simple way.

**Key Features:**
- `concurrent()` helper for parallel operations
- Conditional concurrent execution
- Performance timing and monitoring

## 🔧 **Implementation Strategy**

The Semantic API is a **high-level wrapper** around the Effect-native core:

1. **Semantic nodes** internally create Effect-native nodes
2. **Pipeline builder** translates to core PipelineBuilder
3. **Service injection** uses Effect Layers under the hood
4. **Concurrency helpers** leverage Effect.all() and fiber management
5. **Error handling** bridges standard Errors to Effect's error model

## 💡 **When to Use Which API**

### **Use Semantic API When:**
- ✅ Team is new to Effect-TS
- ✅ Simple pipelines without complex Effect patterns
- ✅ Rapid prototyping and development
- ✅ Teaching and onboarding

### **Use Effect-Native API When:**
- ✅ Complex error handling requirements
- ✅ Advanced Effect patterns (Scope, Resource, etc.)
- ✅ Performance-critical applications
- ✅ Full control over Effect execution

## 🎓 **Migration Path**

1. **Start with Semantic** - Get productive quickly
2. **Learn Effect gradually** - Understand concepts over time
3. **Mix both APIs** - Use what fits each use case
4. **Migrate incrementally** - Convert nodes as needed

The Semantic API provides a **gentle learning curve** while preserving the power of Effect-TS underneath! 