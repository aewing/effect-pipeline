# Orchestrator Runtime

The **Orchestrator** coordinates the execution of all Deployments inside a Cluster.

* Executes each Deployment’s `Pipe` concurrently via `PipelineExecutor`.
* Emits a unified stream of `RuntimeEvent`s across the whole Cluster for real-time observability.
* Provides fault-tolerance: if any Deployment fails, remaining fibers are interrupted and the error bubbles up.
* Can be run from the CLI:

```bash
bun run cli orchestrator path/to/cluster.ts
bun run cli orchestrator path/to/cluster.ts --watch   # hot-reload on file changes
```

## Example
```ts
import { cluster } from "../src/core/clusterBuilder";
import { Orchestrator } from "../src/orchestrator/orchestrator";
import { Queue } from "effect";

const myCluster = cluster("local")
  .addDeployment(apiDeployment)
  .addDeployment(workerDeployment)
  .build();

const eventQueue = await Queue.unbounded();
await Effect.runPromise(new Orchestrator(myCluster, eventQueue).run());
```

## Relationships
* Consumes **Cluster** descriptors (see `clusters.md`).
* Re-uses **PipelineExecutor** for per-Deployment execution.
* Integrated by the **CLI** `orchestrator` command.

---

*See `../../RULES.md` for project-wide conventions.* 