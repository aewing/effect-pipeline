# Effect Pipelines

> Type-safe, declarative data-flow for **Bun** – powered by **Effect TS**

Effect Pipelines lets you compose strongly-typed **Nodes** into **Pipes**, execute them with a **Runtime Engine**, and coordinate everything with a **CLI** – all with the ergonomics of plain TypeScript.

---

## Table of Contents
1. [Why Effect Pipelines?](#why-effect-pipelines)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [Examples](#examples)
5. [CLI](#cli)
6. [Contributing](#contributing)

## Why Effect Pipelines?
* **Productive** – describe your data-flow in TypeScript, run it immediately with Bun.
* **Type-Safe** – schemas travel end-to-end via `@effect/schema`.
* **Composable** – Nodes are just functions; reuse them across services.
* **First-Class DX** – built-in CLI, hot-reload, test helpers, and rich docs.

Each concept is covered in depth in its own feature doc:
* Nodes → [`docs/features/nodes/README.md`](docs/features/nodes/README.md)
* Pipes → [`docs/features/pipes/README.md`](docs/features/pipes/README.md)
* Runtime → [`docs/features/runtime/README.md`](docs/features/runtime/README.md)
* Deployments → [`docs/features/orchestrator/deployments.md`](docs/features/orchestrator/deployments.md)
* Clusters → [`docs/features/orchestrator/clusters.md`](docs/features/orchestrator/clusters.md)

## Quick Start
### Prerequisites
```bash
curl -fsSL https://bun.sh/install | bash   # Bun ≥ 1.2
```

### Bootstrap a new workspace
```bash
bun install              # install dependencies
bun test                 # run tests to verify installation

bun run cli --help       # see available CLI commands
```

## Core Concepts
| Concept | Short Description | Doc |
|---------|-------------------|-----|
| **Node** | The smallest executable unit (Ingress, Transform, Egress, Duplex). | [docs](docs/features/nodes/README.md) |
| **Pipe** | Connects Nodes and enforces schema compatibility. | [docs](docs/features/pipes/README.md) |
| **Runtime** | Executes Pipes with Effect fiber supervision and event streaming. | [docs](docs/features/runtime/README.md) |
| **Deployment** | A runnable manifest (local process, managed cluster, or container). | [docs](docs/features/orchestrator/deployments.md) |
| **Cluster** | A set of Deployments that share config & observability back-ends. | [docs](docs/features/orchestrator/clusters.md) |

## Examples

### Hello World
```ts
// examples/hello.pipeline.ts
import { pipeline } from "../src/pipes/builder";
import { NodeKind, type Node } from "../src/core/node";

const myPipeline = pipeline("hello-world")
  .from(mockIngress)
  .through(mockTransform)
  .to(mockEgress)
  .build();
```

### API Pipeline
```ts
// examples/api.pipeline.ts
export default pipeline("user-api")
  .from(apiIngress)
  .through(validateUser)
  .through(enrichUser)
  .to(apiResponse)
  .build();
```

### Data Processing
```ts
// examples/dataProcessing.pipeline.ts
export default pipeline("data-processing")
  .from(dataIngress)
  .through(filterAdults)
  .through(calculateStats)
  .through(formatOutput)
  .to(dataOutput)
  .build();
```

Run any example:
```bash
bun run cli run examples/hello.pipeline.ts
bun run cli run examples/api.pipeline.ts
bun run cli run examples/dataProcessing.pipeline.ts
```

See [`examples/README.md`](examples/README.md) for detailed examples and usage.

## CLI
```bash
# Run a pipeline
bun run cli run <pipeline-file>

# Run with watch mode
bun run cli run <pipeline-file> --watch

# Run tests
bun test
```

### Available Commands
- `run <file>` - Execute a pipeline file
- `run <file> --watch` - Execute with file watching
- `test` - Run the test suite

## Contributing
We welcome PRs! Please read **[`RULES.md`](RULES.md)** first – it describes file-layout, testing requirements, and documentation expectations.

---
For an expanded architecture overview and roadmap, visit the individual feature docs linked above.