# Deployments

Effect Pipelines can be executed in three distinct modes:

| Mode | Command | Description |
|------|---------|-------------|
| **Local** | `ep run` | Runs the entire pipeline inside the current Bun process – ideal for development & testing. |
| **Managed Cluster** | `ep orchestrator` | Spawns an orchestrator process that supervises one worker per active pipe on the same host. Faults are isolated and auto-restarted. |
| **Container / K8s** | `ep orchestrator --provider=k8s` | The orchestrator runs inside a container and controls worker Pods via provider hooks (alpha). |

Configuration lives in `src/runtime/config/` and is read via `ConfigProvider.fromEnv()` + overrides from `bunfig.toml`.

```ts
// src/runtime/config/manager.ts
export const Config = Config.all(
  Config.int("PORT").withDefault(3000),
  Config.string("DATABASE_URL")
);
```

Deployment descriptors can optionally be expressed in `deploy.yaml`:

```yaml
kind: Deployment
name: analytics
runtime: cluster
workers:
  max: 8
  min: 2
resources:
  memory: 512Mi
  cpu: 0.5
```

> **Note**: YAML support is experimental – TypeScript config is the source of truth.

---

*See `../../../../RULES.md` for project-wide coding conventions.* 