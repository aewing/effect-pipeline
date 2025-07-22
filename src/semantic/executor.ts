// Semantic executor - bridges simple async/await API to Effect-native core
// Provides the best of both worlds: simple API with Effect's power underneath

import { Effect, Queue } from "effect";
import type { SemanticPipeline, SemanticNode, AsyncHandlerWithServices } from "./types";
import type { Node } from "../core/node";
import { NodeKind } from "../core/node";
import type { Pipe } from "../core/pipe";
import { PipelineExecutor } from "../runtime/engine/executor";
import { createServiceRegistry, extractServicesForNode } from "./services";
import type { RuntimeEvent } from "../core/event";

/**
 * Convert a semantic node to an Effect-native node.
 * This bridges the simple async/await API to Effect's powerful execution model.
 */
function convertSemanticNode(semanticNode: SemanticNode, serviceRegistry: Record<string, any>): Node<any, any> {
  // Map semantic kinds to Effect-native kinds
  const nodeKind = semanticNode.kind === "ingress" ? NodeKind.Ingress
    : semanticNode.kind === "transform" ? NodeKind.Transform
    : NodeKind.Egress;

  return {
    kind: nodeKind,
    name: semanticNode.name,
    run: (input: any) => Effect.gen(function* (_) {
      try {
        // Check if the node requires services
        if (semanticNode.requiredServices && semanticNode.requiredServices.length > 0) {
          // Extract required services for this node
          const nodeServices = extractServicesForNode(semanticNode.requiredServices, serviceRegistry);
          
          // Call handler with services
          const handler = semanticNode.handler as AsyncHandlerWithServices<any, any>;
          const result = yield* _(Effect.tryPromise(() => Promise.resolve(handler(input, nodeServices))));
          return result;
        } else {
          // Call handler without services - check arity to determine if it expects services
          const handler = semanticNode.handler;
          if (handler.length > 1) {
            // Handler expects services but none were provided
            const handlerWithServices = handler as AsyncHandlerWithServices<any, any>;
            const result = yield* _(Effect.tryPromise(() => Promise.resolve(handlerWithServices(input, {}))));
            return result;
          } else {
            // Handler doesn't expect services
            const result = yield* _(Effect.tryPromise(() => Promise.resolve(handler(input))));
            return result;
          }
        }
      } catch (error) {
        // Convert regular errors to Effect errors
        if (error instanceof Error) {
          return yield* _(Effect.fail(error));
        }
        return yield* _(Effect.fail(new Error(String(error))));
      }
    })
  };
}

/**
 * Convert a semantic pipeline to an Effect-native pipeline.
 * This allows the semantic API to leverage the full power of the Effect runtime.
 */
function convertSemanticPipeline(semanticPipeline: SemanticPipeline): Pipe {
  // Create service registry for dependency injection
  const serviceRegistry = createServiceRegistry(semanticPipeline.services);
  
  // Convert all semantic nodes to Effect-native nodes
  const effectNodes = semanticPipeline.nodes.map(semanticNode => 
    convertSemanticNode(semanticNode, serviceRegistry)
  );

  return {
    name: semanticPipeline.name,
    nodes: effectNodes
  };
}

/**
 * Run a semantic pipeline using Effect's powerful execution engine.
 * This provides a simple Promise interface while leveraging Effect's capabilities.
 * 
 * @param semanticPipeline - The semantic pipeline to execute
 * @returns Promise that resolves when the pipeline completes successfully
 * 
 * @example
 * ```typescript
 * const pipeline = pipeline("my-pipeline")
 *   .with(database, logger)
 *   .start(ingressNode)
 *   .then(transformNode)
 *   .end(egressNode);
 * 
 * await run(pipeline);
 * ```
 */
export async function run(semanticPipeline: SemanticPipeline): Promise<void> {
  // Convert semantic pipeline to Effect-native pipeline
  const effectPipeline = convertSemanticPipeline(semanticPipeline);
  
  // Create event queue for runtime events
  const eventQueue = await Effect.runPromise(Queue.unbounded<RuntimeEvent>());
  
  // Create Effect-native executor
  const executor = new PipelineExecutor(effectPipeline, eventQueue);
  
  // Run the pipeline and convert back to Promise
  return Effect.runPromise(executor.run());
}

/**
 * Run a semantic pipeline with custom error handling.
 * Provides more control over error handling and recovery.
 * 
 * @param semanticPipeline - The semantic pipeline to execute
 * @param onError - Optional error handler function
 * @returns Promise that resolves when the pipeline completes
 */
export async function runWithErrorHandler(
  semanticPipeline: SemanticPipeline,
  onError?: (error: Error) => Promise<void> | void
): Promise<void> {
  try {
    await run(semanticPipeline);
  } catch (error) {
    if (onError && error instanceof Error) {
      await Promise.resolve(onError(error));
    }
    throw error;
  }
}

/**
 * Run a semantic pipeline with timeout support.
 * Automatically cancels the pipeline if it takes too long.
 * 
 * @param semanticPipeline - The semantic pipeline to execute
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @returns Promise that resolves when the pipeline completes or rejects on timeout
 */
export async function runWithTimeout(
  semanticPipeline: SemanticPipeline,
  timeoutMs: number
): Promise<void> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Pipeline "${semanticPipeline.name}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    run(semanticPipeline),
    timeoutPromise
  ]);
} 