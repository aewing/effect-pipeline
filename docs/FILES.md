# Proposed Project File Structure

_This layout follows the principles in **RULES.md** – one feature per file, mirrored tests, and nested directories for clarity._

```text
effect-pipeline/
├─ bun.lock
├─ package.json
├─ tsconfig.json
├─ README.md
├─ docs/
│  ├─ FILES.md                # <–– you are here
│  ├─ research/
│  │  ├─ Bun.md
│  │  └─ Effect.md
│  └─ features/
│     ├─ nodes/README.md
│     ├─ pipes/README.md
│     ├─ orchestrator/
│     │   ├─ deployments.md
│     │   └─ clusters.md
│     └─ cli/README.md
├─ src/
│  ├─ index.ts                # entry helpers / public API re-exports
│  ├─ adapters/               # integration adapters (S3, Postgres, etc.)
│  ├─ cli/                    # @effect/cli-powered command-line app
│  │  ├─ index.ts             # bun run cli …
│  │  ├─ components/          # TUI components using @effect/printer
│  │  └─ commands/
│  │     ├─ init.ts           # ep init …
│  │     ├─ run.ts            # ep run …
│  │     ├─ deploy.ts         # ep deploy …
│  │     └─ …
│  ├─ nodes/                  # strongly-typed building blocks
│  │  ├─ ingress/
│  │  ├─ transform/
│  │  ├─ egress/
│  │  └─ duplex/
│  ├─ pipes/                  # helpers for composing nodes
│  ├─ orchestrator/           # process supervisor & scaling logic
│  ├─ runtime/
│  │  ├─ engine/              # in-process execution engine
│  │  ├─ hooks/               # lifecycle hooks
│  │  ├─ plugins/             # plugin system
│  │  ├─ events/              # typed event bus
│  │  └─ config/
│  │     ├─ manager.ts        # ConfigProvider wrappers
│  │     └─ types.ts
│  └─ tests/
│     └─ …
└─ scripts/                   # misc dev scripts (lint, release, etc.)
```

> This outline adds only a few folders (e.g. `scripts/`, `tests/`) on top of the existing scaffold. Each segment is documented in `docs/features/*`. 