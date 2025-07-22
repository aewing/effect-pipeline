// Simple node creation functions for the Semantic API
// These hide Effect complexity behind familiar async/await patterns

import type { SemanticNode, AsyncHandler, AsyncHandlerWithServices } from "./types";

/**
 * Create an ingress node that starts a pipeline.
 * Ingress nodes have no input and produce initial data.
 * 
 * @param name - Unique name for the node
 * @param handler - Async function that produces the initial data
 */
export function ingress<O>(
  name: string, 
  handler: AsyncHandler<undefined, O>
): SemanticNode<undefined, O> {
  return {
    name,
    kind: "ingress",
    handler
  };
}

/**
 * Create an ingress node with service dependencies.
 * 
 * @param name - Unique name for the node
 * @param services - Array of required service names
 * @param handler - Async function that receives services and produces data
 */
export function ingressWithServices<O, S = any>(
  name: string,
  services: readonly string[],
  handler: AsyncHandlerWithServices<undefined, O, S>
): SemanticNode<undefined, O> {
  return {
    name,
    kind: "ingress",
    handler,
    requiredServices: services
  };
}

/**
 * Create a transform node that processes data in the middle of a pipeline.
 * Transform nodes receive input and produce output.
 * 
 * @param name - Unique name for the node
 * @param handler - Async function that transforms the input
 */
export function transform<I, O>(
  name: string,
  handler: AsyncHandler<I, O> | AsyncHandlerWithServices<I, O>
): SemanticNode<I, O> {
  return {
    name,
    kind: "transform",
    handler
  };
}

/**
 * Create a transform node with service dependencies.
 * 
 * @param name - Unique name for the node
 * @param services - Array of required service names
 * @param handler - Async function that receives input and services
 */
export function transformWithServices<I, O, S = any>(
  name: string,
  services: readonly string[],
  handler: AsyncHandlerWithServices<I, O, S>
): SemanticNode<I, O> {
  return {
    name,
    kind: "transform",
    handler,
    requiredServices: services
  };
}

/**
 * Create an egress node that ends a pipeline.
 * Egress nodes receive input and typically perform side effects.
 * 
 * @param name - Unique name for the node
 * @param handler - Async function that handles the final output
 */
export function egress<I>(
  name: string,
  handler: AsyncHandler<I, void> | AsyncHandlerWithServices<I, void>
): SemanticNode<I, void> {
  return {
    name,
    kind: "egress",
    handler
  };
}

/**
 * Create an egress node with service dependencies.
 * 
 * @param name - Unique name for the node
 * @param services - Array of required service names
 * @param handler - Async function that receives input and services
 */
export function egressWithServices<I, S = any>(
  name: string,
  services: readonly string[],
  handler: AsyncHandlerWithServices<I, void, S>
): SemanticNode<I, void> {
  return {
    name,
    kind: "egress",
    handler,
    requiredServices: services
  };
} 