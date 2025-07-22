# Pipes

Pipes connect Nodes together to form executable data-flow pipelines. They enforce that Nodes are connected in a valid sequence: Ingress → Transform → Egress.

## Building Pipes

Use the fluent builder API to create Pipes:

```typescript
import { pipeline } from "@effect-pipeline/pipes";
import { httpIngress, mapJson, httpEgress } from "@effect-pipeline/nodes";

const myPipeline = pipeline("hello-world")
  .from(httpIngress("hello-ingress", { path: "/hello" }))
  .through(mapJson("enrich-data", {
    transform: ({ query }) => ({ message: `Hello ${query.name}` })
  }))
  .to(httpEgress("hello-egress", { status: 200 }))
  .build();
```

## Pipeline Validation

The builder enforces several rules:

1. **Must start with Ingress** - Every pipeline must begin with an Ingress Node
2. **Must end with Egress** - Every pipeline must end with an Egress Node  
3. **Valid sequence** - Nodes must be connected in the correct order
4. **At least one Node** - Empty pipelines are not allowed

```typescript
// ❌ This will throw an error
pipeline("invalid")
  .through(transformNode)  // Missing ingress
  .to(egressNode)
  .build();

// ❌ This will throw an error  
pipeline("invalid")
  .from(ingressNode)
  .through(transformNode)
  .build(); // Missing egress

// ✅ This is valid
pipeline("valid")
  .from(ingressNode)
  .through(transformNode)
  .to(egressNode)
  .build();
```

## Multiple Transform Nodes

You can chain multiple Transform or Duplex Nodes in sequence:

```typescript
const complexPipeline = pipeline("data-processing")
  .from(httpIngress("data-ingress", { path: "/data" }))
  .through(mapJson("validate", { transform: validateData }))
  .through(mapJson("enrich", { transform: addMetadata }))
  .through(mapJson("filter", { transform: filterValid }))
  .to(httpEgress("data-egress", { status: 200 }))
  .build();
```

## Pipeline Execution

Built Pipes can be executed by the runtime engine:

```typescript
import { PipelineExecutor } from "@effect-pipeline/runtime";
import { Queue } from "effect";

const eventQueue = await Effect.runPromise(Queue.unbounded());
const executor = new PipelineExecutor(myPipeline, eventQueue);

await Effect.runPromise(executor.run());
```

## Relationships

- **Nodes** - Pipes are composed from individual Nodes
- **Runtime Engine** - Pipes are executed by the PipelineExecutor
- **CLI** - Pipes can be defined in .pipeline.ts files and run with `ep run` 