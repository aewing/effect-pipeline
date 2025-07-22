import { Effect, Queue, Fiber } from "effect";
import type { Cluster } from "../core/cluster";
import type { RuntimeEvent } from "../core/event";
import { PipelineExecutor } from "../runtime/engine";

/**
 * The Orchestrator wires together all deployments inside a {@link Cluster}
 * and executes their pipes concurrently.
 *
 * Each {@link PipelineExecutor} shares the provided {@link Queue} so listeners
 * can observe a single stream of {@link RuntimeEvent}s across the entire
 * cluster execution lifecycle.
 */
export class Orchestrator {
  constructor(
    private readonly cluster: Cluster,
    private readonly eventQueue: Queue.Queue<RuntimeEvent>
  ) {}

  /**
   * Execute every deployment pipeline in its own fiber and wait for all of
   * them to complete. If any deployment fails the orchestrator will propagate
   * the error after cancelling the remaining running fibers.
   */
  run(): Effect.Effect<void, unknown> {
    const self = this;
    return Effect.gen(function* (_) {
      const fibers: Fiber.RuntimeFiber<unknown, unknown>[] = [];

      // Emit cluster start
      yield* _(Queue.offer(self.eventQueue, {
        _tag: "ClusterStarted",
        clusterName: self.cluster.name
      }));

      // Fork one executor per deployment
      for (const deployment of self.cluster.deployments) {
        // Emit deployment start
        yield* _(Queue.offer(self.eventQueue, {
          _tag: "DeploymentStarted",
          deploymentName: deployment.name
        }));

        const executor = new PipelineExecutor(deployment.pipe, self.eventQueue);
        const fiber = yield* _(
          Effect.fork(
            Effect.catchAll(
              Effect.flatMap(executor.run(), () =>
                Queue.offer(self.eventQueue, {
                  _tag: "DeploymentCompleted",
                  deploymentName: deployment.name
                })
              ),
              (error) =>
                Queue.offer(self.eventQueue, {
                  _tag: "DeploymentErrored",
                  deploymentName: deployment.name,
                  error
                })
            )
          )
        );
        fibers.push(fiber);
      }

      // Wait for all fibers to finish (fail-fast)
      for (const f of fibers) {
        yield* _(Fiber.join(f));
      }

      // Emit cluster completed
      yield* _(Queue.offer(self.eventQueue, {
        _tag: "ClusterCompleted",
        clusterName: self.cluster.name
      }));
    });
  }
} 