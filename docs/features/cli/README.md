# Effect Pipelines CLI (`ep`)

Powered by **@effect/cli** – every command is strongly typed and auto-generates `--help` output.

| Command | Summary |
|---------|---------|
| `ep init <name>` | Scaffold a new pipeline package with sample nodes. |
| `ep run <file>`  | Execute a pipeline locally. Hot-reload if `--watch`. |
| `ep lint`        | Run oxlint against the workspace. |
| `ep deploy`      | Build & push container images, then instruct the orchestrator to roll out. |
| `ep orchestrator`| Start the orchestrator process in the current workspace. |

```bash
ep --help

  Effect Pipelines CLI

  Usage
    $ ep <command> [options]

  Commands
    init        create a new pipeline project
    run         run a pipeline locally
    deploy      deploy one or more pipelines to a target environment
    orchestrator  launch supervisor & UI

  For detailed options on any sub-command run `ep <command> --help`.
```

Extending the CLI is as simple as adding a file to `src/cli/commands` that exports a `CliApp.Command` instance.

---

*See `../../../RULES.md` for project-wide coding conventions.* 