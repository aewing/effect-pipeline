import { Effect, Fiber } from "effect";
import type { RuntimeEvent } from "../../core/event";
import { EventBus } from "../events/eventBus";
import type { Plugin } from "./plugin";

export class PluginManager {
  private readonly plugins: Plugin[] = [];

  constructor(private readonly bus: EventBus) {}

  register(plugin: Plugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Start listening to EventBus and dispatch to plugins; returns a Fiber that
   * can be interrupted to stop processing.
   */
  run(): Effect.Effect<Fiber.RuntimeFiber<never, never>, never> {
    return Effect.fork(
      Effect.forever(
        Effect.flatMap(this.bus.take(), (event: RuntimeEvent) =>
          Effect.forEach(this.plugins, (p) => p.onEvent(event), {
            discard: true
          })
        )
      )
    );
  }
} 