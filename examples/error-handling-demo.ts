import { Effect, Layer, Context, pipe, Fiber } from "effect";
import { pipeline } from "../src/pipes/builder";
import { NodeKind, type Node } from "../src/core/node";
import { PipelineExecutor } from "../src/runtime/engine/executor";
import { EventBus } from "../src/runtime/events/eventBus";

// Define custom error types with structured information
class ValidationError extends Error {
  readonly _tag = "ValidationError";
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
  }
}

class NetworkError extends Error {
  readonly _tag = "NetworkError";
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
  }
}

class DatabaseError extends Error {
  readonly _tag = "DatabaseError";
  constructor(
    message: string,
    public readonly operation: string
  ) {
    super(message);
  }
}

// Define services
class ExternalApi extends Context.Tag("ExternalApi")<ExternalApi, {
  readonly fetchUserData: (id: string) => Effect.Effect<{ id: string; name: string }, NetworkError>
}>() {}

class Database extends Context.Tag("Database")<Database, {
  readonly saveUser: (user: { id: string; name: string }) => Effect.Effect<void, DatabaseError>
}>() {}

class Logger extends Context.Tag("Logger")<Logger, {
  readonly info: (message: string) => Effect.Effect<void, never>
  readonly error: (message: string, error?: Error) => Effect.Effect<void, never>
}>() {}

// Pipeline nodes with structured error handling
const dataIngress: Node<undefined, { userId: string }, ValidationError> = {
  kind: NodeKind.Ingress,
  name: "data-ingress",
  run: () => {
    const userId = "user123";
    return userId.length > 0 
      ? Effect.succeed({ userId })
      : Effect.fail(new ValidationError("User ID cannot be empty", "userId", userId));
  }
};

const fetchUserData: Node<
  { userId: string }, 
  { id: string; name: string }, 
  NetworkError | ValidationError,
  ExternalApi | Logger
> = {
  kind: NodeKind.Transform,
  name: "fetch-user-data",
  run: (input) => Effect.gen(function* (_) {
    const api = yield* _(ExternalApi);
    const logger = yield* _(Logger);
    
    yield* _(logger.info(`Fetching data for user: ${input.userId}`));
    
    if (!input.userId) {
      return yield* _(Effect.fail(new ValidationError("User ID is required", "userId", input.userId)));
    }
    
    // This might fail with NetworkError
    const userData = yield* _(api.fetchUserData(input.userId));
    
    yield* _(logger.info(`Successfully fetched data for user: ${userData.name}`));
    return userData;
  })
};

const saveUserData: Node<
  { id: string; name: string },
  { success: boolean; message: string },
  DatabaseError,
  Database | Logger
> = {
  kind: NodeKind.Transform,
  name: "save-user-data", 
  run: (input) => Effect.gen(function* (_) {
    const db = yield* _(Database);
    const logger = yield* _(Logger);
    
    yield* _(logger.info(`Saving user data: ${input.name}`));
    
    // This might fail with DatabaseError
    yield* _(db.saveUser(input));
    
    yield* _(logger.info(`Successfully saved user: ${input.name}`));
    return { success: true, message: `User ${input.name} saved successfully` };
  })
};

const outputResult: Node<
  { success: boolean; message: string },
  void,
  never,
  Logger
> = {
  kind: NodeKind.Egress,
  name: "output-result",
  run: (input) => Effect.gen(function* (_) {
    const logger = yield* _(Logger);
    
    yield* _(logger.info("Pipeline completed successfully"));
    yield* _(Effect.sync(() => {
      console.log("✅ Result:", input);
    }));
  })
};

// Create the pipeline
const errorHandlingPipeline = pipeline("error-handling-demo")
  .from(dataIngress)
  .through(fetchUserData)
  .through(saveUserData)
  .to(outputResult)
  .build();

// Service implementations that can fail
const ExternalApiLive = Layer.succeed(ExternalApi, {
  fetchUserData: (id: string) => {
    // Simulate random failures
    if (Math.random() < 0.3) {
      return Effect.fail(new NetworkError(`Failed to fetch user ${id}`, 503));
    }
    return Effect.succeed({ id, name: `User ${id}` });
  }
});

const DatabaseLive = Layer.succeed(Database, {
  saveUser: (user) => {
    // Simulate random database failures
    if (Math.random() < 0.2) {
      return Effect.fail(new DatabaseError(`Failed to save user ${user.name}`, "INSERT"));
    }
    return Effect.succeed(void 0);
  }
});

const LoggerLive = Layer.succeed(Logger, {
  info: (message: string) =>
    Effect.sync(() => console.log(`[INFO] ${message}`)),
  error: (message: string, error?: Error) =>
    Effect.sync(() => console.error(`[ERROR] ${message}`, error?.message || ""))
});

const AppLayer = Layer.mergeAll(ExternalApiLive, DatabaseLive, LoggerLive);

// Run with comprehensive error handling
const runWithErrorHandling = Effect.gen(function* (_) {
  console.log("🧪 Testing Error Handling Pipeline");
  console.log("=" .repeat(50));
  
  const eventBus = yield* _(EventBus.make());
  const executor = new PipelineExecutor(errorHandlingPipeline, eventBus.getQueue());
  
  // Start event listener to show all events
  const listener = yield* _(Effect.fork(
    Effect.forever(
      Effect.gen(function* (_) {
        const event = yield* _(eventBus.take());
        console.log(`[EVENT] ${event._tag}${
          "nodeName" in event ? ` - ${event.nodeName}` :
          "pipelineName" in event ? ` - ${event.pipelineName}` : ""
        }`);
      })
    )
  ));
  
  // Run with proper error handling  
  const result = yield* _(
    pipe(
      executor.run<ExternalApi | Database | Logger>(),
      Effect.catchAll((error) => Effect.gen(function* (_) {
        console.error("💥 Pipeline failed:", error.message);
        
        // You could implement retry logic, fallback mechanisms, etc. here
        if (error.message.includes("NetworkError")) {
          console.log("🔄 Could implement retry logic for network errors");
        } else if (error.message.includes("DatabaseError")) {
          console.log("💾 Could implement fallback storage for database errors");  
        } else if (error.message.includes("ValidationError")) {
          console.log("✅ Could implement input sanitization for validation errors");
        }
        
        return yield* _(Effect.succeed("Error handled gracefully"));
      }))
    )
  );
  
  yield* _(Fiber.interrupt(listener));
  console.log("=" .repeat(50));
  return result;
});

const program = Effect.provide(runWithErrorHandling, AppLayer);

// Multiple runs to show different error scenarios
const demonstrateErrorHandling = Effect.gen(function* (_) {
  for (let i = 1; i <= 3; i++) {
    console.log(`\n🔄 Run ${i}:`);
    yield* _(program);
    yield* _(Effect.sleep("1 second"));
  }
});

if (import.meta.main) {
  Effect.runPromise(demonstrateErrorHandling).catch(console.error);
}

export { program, AppLayer, errorHandlingPipeline }; 