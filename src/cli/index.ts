import { Effect, Queue, Fiber } from "effect";
import { EventBus } from "../runtime/events/eventBus";
import { PluginManager } from "../runtime/plugins/pluginManager";
import { LoggingPlugin } from "../runtime/plugins/loggingPlugin";
import { PipelineExecutor } from "../runtime/engine";
import type { RuntimeEvent } from "../core/event";
import type { Pipe } from "../core/pipe";
import { join } from "path";
import { watch } from "fs";

const args = process.argv.slice(2);
const command = args[0];

async function runPipeline(file: string, watchMode = false) {
  try {
    console.log(`Loading pipeline from: ${file}`);
    
    // Resolve path relative to project root
    const resolvedPath = join(process.cwd(), file);
    console.log(`Resolved path: ${resolvedPath}`);
    
    const runOnce = async () => {
      // Dynamic import of the pipeline file
      const pipelineModule = await import(resolvedPath);
      const pipeline: Pipe = pipelineModule.default;
      
      if (!pipeline || !pipeline.nodes) {
        throw new Error("Invalid pipeline file: must export a default pipeline");
      }
      
      console.log(`Pipeline "${pipeline.name}" loaded with ${pipeline.nodes.length} nodes`);
      
      await Effect.runPromise(
        Effect.gen(function* (_) {
          const bus = yield* _(EventBus.make());
          const pluginManager = new PluginManager(bus);
          pluginManager.register(LoggingPlugin);
          const pluginFiber = yield* _(pluginManager.run());

          const executor = new PipelineExecutor(pipeline, bus.getQueue());

          console.log("Starting pipeline execution...");
          yield* _(executor.run());
          console.log("Pipeline completed successfully!");

          yield* _(Fiber.interrupt(pluginFiber));
        })
      );
    };

    if (watchMode) {
      console.log("Starting in watch mode...");
      console.log("Press Ctrl+C to stop");
      
      // Run once immediately
      await runOnce();
      
      // Watch for file changes
      watch(resolvedPath, async (eventType) => {
        if (eventType === "change") {
          console.log("\n🔄 File changed, restarting pipeline...");
          try {
            await runOnce();
          } catch (error) {
            console.error("Pipeline failed:", error);
          }
        }
      });
      
      // Keep the process running
      process.on("SIGINT", () => {
        console.log("\n👋 Stopping watch mode");
        process.exit(0);
      });
      
    } else {
      await runOnce();
    }
    
  } catch (error) {
    console.error("Failed to run pipeline:", error);
    process.exit(1);
  }
}

async function runCluster(file: string, watchMode = false) {
  try {
    console.log(`Loading cluster from: ${file}`);

    const resolvedPath = join(process.cwd(), file);
    console.log(`Resolved path: ${resolvedPath}`);

    const runOnce = async () => {
      const clusterModule = await import(resolvedPath);
      const cluster = clusterModule.default;
      if (!cluster || !cluster.deployments) {
        throw new Error("Invalid cluster file: must export a default cluster");
      }
      console.log(`Cluster "${cluster.name}" loaded with ${cluster.deployments.length} deployments`);

      await Effect.runPromise(
        Effect.gen(function* (_) {
          const { Orchestrator } = yield* _(Effect.promise(() => import("../orchestrator/orchestrator")));
          const bus = yield* _(EventBus.make());
          const pluginManager = new PluginManager(bus);
          pluginManager.register(LoggingPlugin);
          const pluginFiber = yield* _(pluginManager.run());

          const orchestrator = new Orchestrator(cluster, bus.getQueue());
          console.log("Starting orchestrator...");
          yield* _(orchestrator.run());
          console.log("All deployments completed!");

          yield* _(Fiber.interrupt(pluginFiber));
        })
      );
    };

    if (watchMode) {
      console.log("Starting orchestrator in watch mode...");
      console.log("Press Ctrl+C to stop");
      await runOnce();
      watch(resolvedPath, async (eventType) => {
        if (eventType === "change") {
          console.log("\n🔄 Cluster file changed, restarting orchestrator...");
          try {
            await runOnce();
          } catch (error) {
            console.error("Orchestrator run failed:", error);
          }
        }
      });
      process.on("SIGINT", () => {
        console.log("\n👋 Stopping watch mode");
        process.exit(0);
      });
    } else {
      await runOnce();
    }
  } catch (error) {
    console.error("Failed to run orchestrator:", error);
    process.exit(1);
  }
}

if (command === "run") {
  const file = args[1];
  const watchMode = args.includes("--watch") || args.includes("-w");
  
  if (!file) {
    console.error("Error: Please provide a pipeline file path");
    console.log("Usage: bun run cli run <pipeline-file> [--watch]");
    process.exit(1);
  }
  
  runPipeline(file, watchMode);
} else if (command === "orchestrator") {
  const file = args[1];
  const watchMode = args.includes("--watch") || args.includes("-w");

  if (!file) {
    console.error("Error: Please provide a cluster file path");
    console.log("Usage: bun run cli orchestrator <cluster-file> [--watch]");
    process.exit(1);
  }

  runCluster(file, watchMode);
} else {
  console.log("Effect Pipeline CLI");
  console.log("Available commands:");
  console.log("  bun run cli run <file> [--watch]  - Run a pipeline file");
  console.log("  bun test                          - Run tests");
  console.log("  bun run cli orchestrator <file> [--watch] - Run a cluster file");
  console.log("");
  console.log("Examples:");
  console.log("  bun run cli run examples/hello.pipeline.ts");
  console.log("  bun run cli run examples/api.pipeline.ts --watch");
} 