# Plugin System

Effect Pipelines exposes a lightweight **Plugin** API that lets you tap into the runtime event stream to implement logging, metrics, tracing, etc.

## Quick Example
```ts
import { LoggingPlugin } from "../../src/runtime/plugins/loggingPlugin";
import { PluginManager } from "../../src/runtime/plugins/pluginManager";
import { EventBus } from "../../src/runtime/events/eventBus";

const bus = await Effect.runPromise(EventBus.make());
const plugins = new PluginManager(bus);
plugins.register(LoggingPlugin);
await Effect.runPromise(plugins.run());
```

## Plugin Interface
```ts
interface Plugin {
  readonly name: string;
  onEvent: (event: RuntimeEvent) => Effect<void, never>;
}
```

## Built-in Plugins
* **LoggingPlugin** – prints every event to stdout. Used by the CLI by default.

## Relationships
* Consumes events via **EventBus**.
* Managed by **PluginManager** which runs inside CLI & Orchestrator.

---
See `../../RULES.md` for contribution guidelines. 