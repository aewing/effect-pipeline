# Effect TS – Highlights for Effect Pipelines

## Core Runtime

* Pure, lazily-evaluated `Effect<R, E, A>` data type – type-safe error & dependency management.
* Structured concurrency with automatic interruption & supervised fibers.
* Built-in streams, channels & queues for back-pressure-aware dataflow.

## Ecosystem Packages We Leverage

| Package | Purpose |
|---------|---------|
| `@effect/cli` | Declarative, type-safe CLI powering the `ep` tool. |
| `@effect/platform-bun` | Bun-optimised platform layer (FS, HTTP, workers). |
| `@effect/sql-sqlite-bun` | Zero-dependency SQLite client for runtime state. |
| `@effect/experimental` | Durable workflows & CRON used by the orchestrator. |
| `@effect/printer-ansi` | Rich ANSI rendering for CLI output & logs. |

## Design Guidelines For This Repository

1. Expose **`Effect`** values at public boundaries – never raw Promises.
2. Use `Config` & `ConfigProvider` for _all_ runtime configuration.
3. Nodes run inside supervised fibers; failures are isolated & reported back to the orchestrator layer.
4. CLI commands are implemented as `Command`s from `@effect/cli`, giving us automatic `--help`, validation & shell-completion.