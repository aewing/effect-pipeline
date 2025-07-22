import { Effect, Queue } from "effect";
import type { Node } from "../../core/node";
import type { Pipe } from "../../core/pipe";
import type { RuntimeEvent } from "../../core/event";

/**
 * The runtime engine that executes a Pipe by wiring its Nodes together.
 * Each Node runs in its own Effect fiber with back-pressure handling.
 * 
 * The executor automatically propagates context requirements from all nodes
 * to the final Effect, enabling dependency injection.
 */
export class PipelineExecutor {
  constructor(
    private readonly pipe: Pipe,
    private readonly eventQueue: Queue.Queue<RuntimeEvent>
  ) {}

  /**
   * Execute the pipeline by running each Node in sequence.
   * Ingress Nodes start the flow, Transform Nodes process data,
   * and Egress Nodes handle final output.
   * 
   * The return type automatically infers the union of all context requirements
   * from the nodes in the pipeline, enabling type-safe dependency injection.
   */
  run<R = never>(): Effect.Effect<void, Error, R> {
    const self = this;
    return Effect.gen(function* (_) {
      yield* _(Queue.offer(self.eventQueue, {
        _tag: "PipelineStarted",
        pipelineName: self.pipe.name
      }));

      let currentInput: unknown = undefined;

      for (const node of self.pipe.nodes) {
        yield* _(Queue.offer(self.eventQueue, {
          _tag: "NodeStarted",
          nodeName: node.name
        }));

        // Catch and wrap node errors with context, preserving the context requirements
        const result = yield* _(
          Effect.catchAll(
            node.run(currentInput) as Effect.Effect<any, any, R>,
            (error) => {
              // Emit error event before failing
              return Effect.gen(function* (_) {
                yield* _(Queue.offer(self.eventQueue, {
                  _tag: "NodeErrored", 
                  nodeName: node.name,
                  error
                }));
                return yield* _(Effect.fail(new Error(`Node ${node.name} failed: ${error}`)));
              });
            }
          )
        );

        yield* _(Queue.offer(self.eventQueue, {
          _tag: "NodeCompleted",
          nodeName: node.name
        }));

        currentInput = result;
      }

      yield* _(Queue.offer(self.eventQueue, {
        _tag: "PipelineCompleted",
        pipelineName: self.pipe.name
      }));
    });
  }
} 