import { Effect, Layer, Context } from "effect";
import { PipelineExecutor } from "../src/runtime/engine/executor";
import { EventBus } from "../src/runtime/events/eventBus";
import pipeline from "./api.pipeline";

// Import the services from the pipeline
class Database extends Context.Tag("Database")<Database, {
  readonly query: (sql: string) => Effect.Effect<unknown[], never>
  readonly save: (data: unknown) => Effect.Effect<{ id: string }, never>
}>() {}

class Logger extends Context.Tag("Logger")<Logger, {
  readonly info: (message: string) => Effect.Effect<void, never>
  readonly error: (message: string) => Effect.Effect<void, never>
}>() {}

// Create concrete implementations
const DatabaseLive = Layer.succeed(Database, {
  query: (sql: string) => 
    Effect.sync(() => {
      console.log(`[DB] Executing query: ${sql}`);
      return [];
    }),
  save: (data: unknown) =>
    Effect.sync(() => {
      const id = Math.random().toString(36).substr(2, 9);
      console.log(`[DB] Saved data with ID: ${id}`, data);
      return { id };
    })
});

const LoggerLive = Layer.succeed(Logger, {
  info: (message: string) =>
    Effect.sync(() => {
      console.log(`[INFO] ${message}`);
    }),
  error: (message: string) =>
    Effect.sync(() => {
      console.error(`[ERROR] ${message}`);
    })
});

// Combine all dependencies  
const AppLayer = Layer.merge(DatabaseLive, LoggerLive);

// Run the pipeline with dependencies
const runPipelineWithDependencies = Effect.gen(function* (_) {
  const eventBus = yield* _(EventBus.make());
  const executor = new PipelineExecutor(pipeline, eventBus.getQueue());
  
  console.log("🚀 Running API pipeline with Effect dependencies...");
  console.log("=" .repeat(60));
  
  yield* _(executor.run());
  
  console.log("=" .repeat(60));
  console.log("✅ Pipeline completed successfully!");
});

// Execute with all dependencies provided
const program = Effect.provide(runPipelineWithDependencies, AppLayer);

// For demonstration - you would normally use Effect.runPromise in your application
if (import.meta.main) {
  Effect.runPromise(program).catch(console.error);
}

export { program, AppLayer }; 