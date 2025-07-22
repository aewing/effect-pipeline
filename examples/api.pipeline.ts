import { pipeline } from "../src/pipes/builder";
import { NodeKind, type Node, Effect } from "../src/core/node";
import { Context } from "effect";

// Define services for dependency injection
class Database extends Context.Tag("Database")<Database, {
  readonly query: (sql: string) => Effect.Effect<unknown[], never>
  readonly save: (data: unknown) => Effect.Effect<{ id: string }, never>
}>() {}

class Logger extends Context.Tag("Logger")<Logger, {
  readonly info: (message: string) => Effect.Effect<void, never>
  readonly error: (message: string) => Effect.Effect<void, never>
}>() {}

// Define custom error types
class ValidationError extends Error {
  readonly _tag = "ValidationError"
  constructor(message: string) {
    super(message)
  }
}

// API Pipeline - now with dependency injection and proper error handling
const apiIngress: Node<undefined, { method: string; path: string; headers: Record<string, string>; body: any }> = {
  kind: NodeKind.Ingress,
  name: "api-ingress",
  run: () => Effect.succeed({
    method: "POST",
    path: "/api/users", 
    headers: { "content-type": "application/json" },
    body: { name: "John Doe", email: "john@example.com" }
  })
};

const validateUser: Node<
  { body: { name?: string; email?: string } }, 
  { body: { name: string; email: string }; validated: true }, 
  ValidationError,
  Logger
> = {
  kind: NodeKind.Transform,
  name: "validate-user",
  run: (input) => Effect.gen(function* (_) {
    const logger = yield* _(Logger);
    
    yield* _(logger.info("Validating user input"));
    
    if (!input.body?.name || !input.body?.email) {
      yield* _(logger.error("Validation failed: missing required fields"));
      return yield* _(Effect.fail(new ValidationError("Missing required fields: name and email")));
    }
    
    yield* _(logger.info("User validation successful"));
    return { 
      ...input, 
      body: { name: input.body.name, email: input.body.email },
      validated: true as const 
    };
  })
};

const enrichUser: Node<
  { body: { name: string; email: string } },
  { body: { id: string; name: string; email: string; createdAt: string; status: string } },
  never,
  Database | Logger
> = {
  kind: NodeKind.Transform,
  name: "enrich-user", 
  run: (input) => Effect.gen(function* (_) {
    const database = yield* _(Database);
    const logger = yield* _(Logger);
    
    yield* _(logger.info("Enriching user data"));
    
    const savedUser = yield* _(database.save({
      ...input.body,
      createdAt: new Date().toISOString(),
      status: "active"
    }));
    
    return {
      ...input,
      body: {
        id: savedUser.id,
        ...input.body,
        createdAt: new Date().toISOString(),
        status: "active"
      }
    };
  })
};

const apiResponse: Node<
  { body: any },
  void,
  never,
  Logger  
> = {
  kind: NodeKind.Egress,
  name: "api-response",
  run: (input) => Effect.gen(function* (_) {
    const logger = yield* _(Logger);
    
    yield* _(logger.info("Sending API response"));
    
    yield* _(Effect.sync(() => {
      console.log("API Response:", {
        status: 201,
        headers: { "content-type": "application/json" },
        body: input.body
      });
    }));
  })
};

export default pipeline("user-api")
  .from(apiIngress)
  .through(validateUser)
  .through(enrichUser)
  .to(apiResponse)
  .build(); 