import { describe, it, expect } from "bun:test";
import { Effect, Fiber } from "effect";
import { EventBus } from "../events/eventBus";
import { PluginManager } from "./pluginManager";
import type { Plugin } from "./plugin";


describe("PluginManager", () => {
  it("should dispatch events to registered plugins", async () => {
    let count = 0;
    const plugin: Plugin = {
      name: "counter",
      onEvent: () => {
        count += 1;
        return Effect.succeed(undefined);
      }
    };

    await Effect.runPromise(
      Effect.gen(function* (_) {
        const bus = yield* _(EventBus.make());
        const manager = new PluginManager(bus);
        manager.register(plugin);
        const fiber = yield* _(manager.run());

        // publish two events
        yield* _(bus.publish({ _tag: "NodeStarted", nodeName: "x" }));
        yield* _(bus.publish({ _tag: "PipelineCompleted", pipelineName: "p" }));

        // small sleep to allow processing
        yield* _(Effect.sleep(50));

        // interrupt processing fiber
        yield* _(Fiber.interrupt(fiber));
      })
    );

    expect(count).toBe(2);
  });
}); 