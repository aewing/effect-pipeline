import { Effect, Layer, Context } from "effect";
import { pipeline } from "../src/pipes/builder";
import { NodeKind, type Node } from "../src/core/node";
import { PipelineExecutor } from "../src/runtime/engine/executor";
import { EventBus } from "../src/runtime/events/eventBus";

// Services for independent operations
class UserService extends Context.Tag("UserService")<UserService, {
  readonly getProfile: (id: string) => Effect.Effect<{ name: string; email: string }, never>
}>() {}

class PreferencesService extends Context.Tag("PreferencesService")<PreferencesService, {
  readonly getPreferences: (id: string) => Effect.Effect<{ theme: string; language: string }, never>
}>() {}

class PermissionsService extends Context.Tag("PermissionsService")<PermissionsService, {
  readonly getPermissions: (id: string) => Effect.Effect<{ roles: string[] }, never>
}>() {}

// Node that demonstrates concurrent execution of independent operations
const fetchUserData: Node<
  { userId: string },
  { 
    profile: { name: string; email: string };
    preferences: { theme: string; language: string };
    permissions: { roles: string[] };
  },
  never,
  UserService | PreferencesService | PermissionsService
> = {
  kind: NodeKind.Transform,
  name: "fetch-user-data-concurrently",
  run: (input) => Effect.gen(function* (_) {
    const userService = yield* _(UserService);
    const preferencesService = yield* _(PreferencesService);
    const permissionsService = yield* _(PermissionsService);
    
    console.log(`🚀 Starting concurrent fetch for user: ${input.userId}`);
    
    // Execute all three operations concurrently
    const [profile, preferences, permissions] = yield* _(
      Effect.all([
        userService.getProfile(input.userId),
        preferencesService.getPreferences(input.userId), 
        permissionsService.getPermissions(input.userId)
      ], { concurrency: 3 })
    );
    
    console.log(`✅ All concurrent operations completed for user: ${input.userId}`);
    
    return {
      profile,
      preferences, 
      permissions
    };
  })
};

// Simple ingress and egress for the demo
const userIngress: Node<undefined, { userId: string }> = {
  kind: NodeKind.Ingress,
  name: "user-ingress",
  run: () => Effect.succeed({ userId: "user-123" })
};

const dataEgress: Node<any, void> = {
  kind: NodeKind.Egress,
  name: "data-egress", 
  run: (input) => Effect.sync(() => {
    console.log("📊 Final user data:", JSON.stringify(input, null, 2));
  })
};

// Create the pipeline
const concurrencyPipeline = pipeline("concurrency-demo")
  .from(userIngress)
  .through(fetchUserData)
  .to(dataEgress)
  .build();

// Service implementations with simulated delays
const UserServiceLive = Layer.succeed(UserService, {
  getProfile: (id: string) => 
    Effect.gen(function* (_) {
      console.log(`  [UserService] Fetching profile for ${id}...`);
      yield* _(Effect.sleep("200 millis")); // Simulate API call
      console.log(`  [UserService] Profile fetched for ${id}`);
      return { name: `User ${id}`, email: `${id}@example.com` };
    })
});

const PreferencesServiceLive = Layer.succeed(PreferencesService, {
  getPreferences: (id: string) =>
    Effect.gen(function* (_) {
      console.log(`  [PreferencesService] Fetching preferences for ${id}...`);
      yield* _(Effect.sleep("150 millis")); // Simulate API call
      console.log(`  [PreferencesService] Preferences fetched for ${id}`);
      return { theme: "dark", language: "en" };
    })
});

const PermissionsServiceLive = Layer.succeed(PermissionsService, {
  getPermissions: (id: string) =>
    Effect.gen(function* (_) {
      console.log(`  [PermissionsService] Fetching permissions for ${id}...`);
      yield* _(Effect.sleep("100 millis")); // Simulate API call  
      console.log(`  [PermissionsService] Permissions fetched for ${id}`);
      return { roles: ["user", "premium"] };
    })
});

const AppLayer = Layer.mergeAll(
  UserServiceLive,
  PreferencesServiceLive,
  PermissionsServiceLive
);

// Run the concurrent pipeline
const runConcurrencyDemo = Effect.gen(function* (_) {
  console.log("🏃‍♂️ Concurrency Demo - Independent Operations");
  console.log("=" .repeat(60));
  
  const eventBus = yield* _(EventBus.make());
  const executor = new PipelineExecutor(concurrencyPipeline, eventBus.getQueue());
  
  const startTime = Date.now();
  
  yield* _(executor.run<UserService | PreferencesService | PermissionsService>());
  
  const endTime = Date.now();
  console.log(`⏱️  Total execution time: ${endTime - startTime}ms`);
  console.log("   (Should be ~200ms due to concurrency, not ~450ms sequential)");
  console.log("=" .repeat(60));
});

const program = Effect.provide(runConcurrencyDemo, AppLayer);

if (import.meta.main) {
  Effect.runPromise(program).catch(console.error);
}

export { program, concurrencyPipeline }; 