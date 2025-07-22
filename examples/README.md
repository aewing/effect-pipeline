# Effect Pipeline Examples

This directory contains working examples that demonstrate how to use Effect Pipelines for different use cases.

## Available Examples

### 1. Hello World (`hello.pipeline.ts`)
A simple pipeline that demonstrates basic Node composition:
- **Ingress**: Generates a mock HTTP request
- **Transform**: Enriches the request with a greeting message
- **Egress**: Logs the final response

```bash
bun run cli run examples/hello.pipeline.ts
```

### 2. API Pipeline (`api.pipeline.ts`)
A realistic API endpoint simulation:
- **Ingress**: Simulates a POST request with user data
- **Transform**: Validates required fields (name, email)
- **Transform**: Enriches user data with ID, timestamp, and status
- **Egress**: Returns formatted API response

```bash
bun run cli run examples/api.pipeline.ts
```

### 3. Data Processing (`dataProcessing.pipeline.ts`)
A complex data transformation pipeline:
- **Ingress**: Loads a dataset of people with scores
- **Transform**: Filters to adults only
- **Transform**: Calculates statistics (average score, high performers)
- **Transform**: Formats output for display
- **Egress**: Pretty-prints results with performance categories

```bash
bun run cli run examples/dataProcessing.pipeline.ts
```

## Running Examples

### Basic Execution
```bash
bun run cli run examples/<filename>.pipeline.ts
```

### Watch Mode
```bash
bun run cli run examples/<filename>.pipeline.ts --watch
```

## Creating Your Own Examples

1. **Create a new `.pipeline.ts` file** in the `examples/` directory
2. **Import the builder**: `import { pipeline } from "../src/pipes/builder"`
3. **Define your Nodes** using the Node interface or helper functions
4. **Build the pipeline** using the fluent API
5. **Export as default**: `export default pipeline("name").from().through().to().build()`

## Example Structure

```typescript
import { pipeline } from "../src/pipes/builder";
import { NodeKind, type Node } from "../src/core/node";

// Define your Nodes
const myIngress: Node<any, any> = {
  kind: NodeKind.Ingress,
  name: "my-ingress",
  run: async () => ({ data: "example" })
};

const myTransform: Node<any, any> = {
  kind: NodeKind.Transform,
  name: "my-transform",
  run: async (input) => ({ ...input, processed: true })
};

const myEgress: Node<any, any> = {
  kind: NodeKind.Egress,
  name: "my-egress",
  run: async (input) => {
    console.log("Result:", input);
    return input;
  }
};

// Build and export the pipeline
export default pipeline("my-example")
  .from(myIngress)
  .through(myTransform)
  .to(myEgress)
  .build();
```

## Next Steps

- Try modifying the examples to add your own transformations
- Experiment with different Node types (Ingress, Transform, Egress, Duplex)
- Add error handling and validation to your pipelines
- Explore the available Node helpers in `src/nodes/` 