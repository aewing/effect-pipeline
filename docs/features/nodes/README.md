# Nodes

Nodes are the fundamental building blocks of Effect Pipelines. Each Node represents a unit of execution that consumes an input value and produces an output value.

## Node Kinds

### Ingress Nodes
Ingress Nodes start a pipeline by generating data from external sources. They have no input (use `undefined`) and produce output that flows to the next Node.

**Available Ingress Nodes:**
- `httpIngress` - Listen for HTTP requests and extract query params, headers, and body

### Transform Nodes  
Transform Nodes process data in the middle of a pipeline. They take input from the previous Node, transform it, and pass the result to the next Node.

**Available Transform Nodes:**
- `mapJson` - Apply a function to transform input data

### Egress Nodes
Egress Nodes end a pipeline by sending data to external destinations. They may return `void` to indicate fire-and-forget side-effects.

**Available Egress Nodes:**
- `httpEgress` - Send HTTP responses with status, headers, and body

### Duplex Nodes
Duplex Nodes can both consume and produce data, useful for bidirectional communication or complex processing logic.

**Available Duplex Nodes:**
- `echo` - Echo input back as output (useful for testing and debugging)

## Creating Custom Nodes

To create a custom Node, implement the `Node` interface:

```typescript
import { NodeKind, type Node } from "@effect-pipeline/core";

const myNode: Node<string, number> = {
  kind: NodeKind.Transform,
  name: "my-transform",
  run: async (input) => {
    // Your transformation logic here
    return input.length;
  }
};
```

## Node Configuration

Each Node type accepts configuration options that customize its behavior:

```typescript
// HTTP Ingress with custom path and method
const ingress = httpIngress("api-ingress", {
  path: "/api/data",
  method: "POST",
  port: 8080
});

// JSON Transform with custom function
const transform = mapJson("enrich-data", {
  transform: (input) => ({
    ...input,
    timestamp: new Date().toISOString()
  })
});

// HTTP Egress with custom status and headers
const egress = httpEgress("api-response", {
  status: 201,
  headers: { "x-custom": "value" }
});
```

## Relationships

- **Pipes** - Nodes are composed into Pipes using the fluent builder API
- **Runtime Engine** - Nodes are executed by the PipelineExecutor
- **CLI** - Nodes can be referenced in pipeline files loaded by `ep run` 