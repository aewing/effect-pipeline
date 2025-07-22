import { Effect } from "effect";

export enum NodeKind {
  Ingress = "ingress",
  Transform = "transform",
  Egress = "egress",
  Duplex = "duplex"
}

/**
 * A strongly-typed Node description. A Node is a unit of execution that
 * consumes an **input** value and produces an **output** value. Ingress Nodes
 * have no input (use `undefined`). Egress Nodes may return `void` to indicate
 * fire-and-forget side-effects.
 *
 * The `I` and `O` generics represent the concrete value *shapes* that will be
 * exchanged *at runtime*. The `E` and `R` generics provide Effect's error
 * and dependency management capabilities. The `IS` and `OS` generics allow 
 * callers to attach an `@effect/schema` for each side – enabling compile-time 
 * pipe validation without forcing every call-site to import Schema helpers.
 */
export interface Node<I = unknown, O = unknown, E = never, R = never, IS = unknown, OS = unknown> {
  readonly kind: NodeKind;
  /**
   * A unique, stable identifier used in logs and orchestration manifests.
   */
  readonly name: string;
  /**
   * The runtime handler for this Node. Returns an Effect that can:
   * - Access services from the context (R)
   * - Fail with typed errors (E) 
   * - Produce a value (O)
   */
  readonly run: (input: I) => Effect.Effect<O, E, R>;
  /**
   * Optional input schema for compile-time validation.
   */
  readonly inputSchema?: IS;
  /**
   * Optional output schema for compile-time validation.
   */
  readonly outputSchema?: OS;
}

// Re-export Effect for convenience when creating nodes
export { Effect } from "effect"; 