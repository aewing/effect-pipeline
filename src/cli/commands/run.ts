import { Command, Args } from "@effect/cli";
import { Effect, Queue, Fiber } from "effect";
import { PipelineExecutor } from "../../runtime/engine/executor";
import type { Pipe } from "../../core/pipe";
import type { RuntimeEvent } from "../../core/event";

type Argv = readonly string[];

export const runCommand = Command.make("run")
  .pipe(
    // @ts-expect-error – effect/cli's typings lag behind implementation where `handler` exists
    Command.handler((args: Argv) =>
      Effect.gen(function* (_) {
        const file = args[0];
        
        if (!file) {
          console.error("Error: Please provide a pipeline file path");
          console.log("Usage: bun run cli run <pipeline-file>");
          return;
        }
        
        console.log(`Loading pipeline from: ${file}`);
        
        try {
          // Dynamic import of the pipeline file
          const pipelineModule = yield* _(Effect.promise(() => import(file)));
          const pipeline: Pipe = pipelineModule.default;
          
          if (!pipeline || !pipeline.nodes) {
            throw new Error("Invalid pipeline file: must export a default pipeline");
          }
          
          console.log(`Pipeline "${pipeline.name}" loaded with ${pipeline.nodes.length} nodes`);
          
          const eventQueue = yield* _(Queue.unbounded<RuntimeEvent>());
          
          // Start event listener
          const listener = yield* _(
            Effect.fork(
              Effect.forever(
                Effect.gen(function* (_) {
                  const event = yield* _(Queue.take(eventQueue));
                  const timestamp = new Date().toISOString();
                  const name =
                    "nodeName" in event
                      ? event.nodeName
                      : "pipelineName" in event
                      ? (event as any).pipelineName
                      : "";
                  console.log(`[${timestamp}] ${event._tag}: ${name}`);
                })
              )
            )
          );

          const executor = new PipelineExecutor(pipeline, eventQueue);
          
          console.log("Starting pipeline execution...");
          
          // Note: If the pipeline requires dependencies, they should be provided
          // via Effect.provide() before calling this command, or the pipeline file
          // should export a program with dependencies already provided
          yield* _(executor.run());
          
          console.log("Pipeline completed successfully!");

          yield* _(Fiber.interrupt(listener));
        } catch (error) {
          console.error("Failed to run pipeline:", error);
          process.exit(1);
        }
      })
    )
  ); 