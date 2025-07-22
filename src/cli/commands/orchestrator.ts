import { Command } from "@effect/cli";
import { Effect, Queue, Fiber } from "effect";
import { Orchestrator } from "../../orchestrator/orchestrator";
import type { Cluster } from "../../core/cluster";
import type { RuntimeEvent } from "../../core/event";
import { EventBus } from "../../runtime/events/eventBus";
import { PluginManager } from "../../runtime/plugins/pluginManager";
import { LoggingPlugin } from "../../runtime/plugins/loggingPlugin";

type Argv = readonly string[];

export const orchestratorCommand = Command.make("orchestrator")
  .pipe(
    // @ts-expect-error upstream typings
    Command.handler((args: Argv) =>
      Effect.gen(function* (_) {
        const file = args[0];

        if (!file) {
          console.error("Error: Please provide a cluster file path");
          console.log("Usage: bun run cli orchestrator <cluster-file>");
          return;
        }

        console.log(`Loading cluster from: ${file}`);

        try {
          // Dynamic import of the cluster definition file
          const clusterModule = yield* _(Effect.promise(() => import(file)));
          const cluster: Cluster = clusterModule.default;

          if (!cluster || !cluster.deployments) {
            throw new Error("Invalid cluster file: must export a default cluster");
          }

          console.log(
            `Cluster "${cluster.name}" loaded with ${cluster.deployments.length} deployments`
          );

          const bus = yield* _(EventBus.make());
          const pluginManager = new PluginManager(bus);
          pluginManager.register(LoggingPlugin);
          const pluginFiber = yield* _(pluginManager.run());

          const orchestrator = new Orchestrator(cluster, bus.getQueue());
          console.log("Starting orchestrator...");
          yield* _(orchestrator.run());
          console.log("All deployments completed!");

          yield* _(Fiber.interrupt(pluginFiber));
        } catch (error) {
          console.error("Failed to run orchestrator:", error);
          process.exit(1);
        }
      })
    )
  ); 