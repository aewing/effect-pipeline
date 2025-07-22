# Clusters

A **Cluster** is a logical group of deployments that share:

* Configuration sources (ConfigProvider).
* Metrics & tracing backends.
* Inter-pipeline routing rules.

Clusters enable you to scale pipelines horizontally across machines or regions while retaining a single coordination layer.

> **Implementation:** Clusters are produced via the fluent `cluster(name)` builder defined in `src/core/clusterBuilder.ts`.

```ts
import { cluster } from "../../src/core/clusterBuilder";

const prodCluster = cluster("prod-us-east")
  .addDeployment(apiDeployment)
  .addDeployment(analyticsDeployment)
  .withConfig({ region: "us-east-1" })
  .build();
```

Future roadmap items:
* Federation between clusters via gRPC.
* Blue/green & canary rollout helpers.

---

### Relationships
* Uses **ClusterBuilder** for descriptor creation.
* Consumed by the **Orchestrator** runtime (see `orchestrator/README.md`).

---

*See `../../../../RULES.md` for project-wide coding conventions.* 