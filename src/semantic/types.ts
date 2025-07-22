// Core types for the Semantic API
// These provide a simple, Promise-based interface over Effect-native types

export type AsyncHandler<I, O> = (input: I) => Promise<O> | O;
export type AsyncHandlerWithServices<I, O, S = any> = (input: I, services: S) => Promise<O> | O;

// Simplified service definition
export interface SemanticService {
  readonly name: string;
  readonly implementation: Record<string, (...args: any[]) => Promise<any> | any>;
}

// Simplified node types that feel familiar to async/await developers
export interface SemanticNode<I = any, O = any> {
  readonly name: string;
  readonly kind: "ingress" | "transform" | "egress";
  readonly handler: AsyncHandler<I, O> | AsyncHandlerWithServices<I, O>;
  readonly requiredServices?: readonly string[];
}

// Simplified pipeline that combines nodes and services
export interface SemanticPipeline {
  readonly name: string;
  readonly nodes: readonly SemanticNode[];
  readonly services: readonly SemanticService[];
}

// Builder interface for fluent pipeline creation
export interface SemanticPipelineBuilder {
  with(...services: SemanticService[]): SemanticPipelineBuilder;
  start(node: SemanticNode): SemanticPipelineBuilderWithStart;
}

export interface SemanticPipelineBuilderWithStart {
  then(node: SemanticNode): SemanticPipelineBuilderWithStart;
  end(node: SemanticNode): SemanticPipeline;
}

// Concurrency helper types
export type ConcurrentOperations = Record<string, Promise<any>>;
export type ConcurrentResults<T extends ConcurrentOperations> = {
  [K in keyof T]: Awaited<T[K]>;
}; 