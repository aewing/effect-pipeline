// Semantic API - Main export
// Provides a simple, intuitive interface for Effect Pipeline

// Node creation functions
export { 
  ingress, 
  ingressWithServices,
  transform, 
  transformWithServices,
  egress, 
  egressWithServices 
} from "./nodes";

// Service management
export { service } from "./services";

// Pipeline building
export { pipeline } from "./pipeline";

// Pipeline execution
export { 
  run, 
  runWithErrorHandler, 
  runWithTimeout 
} from "./executor";

// Concurrency helpers
export { 
  concurrent, 
  concurrentWithTimeout, 
  concurrentAllowFailures 
} from "./concurrency";

// Types for advanced users
export type {
  SemanticNode,
  SemanticService,
  SemanticPipeline,
  SemanticPipelineBuilder,
  SemanticPipelineBuilderWithStart,
  AsyncHandler,
  AsyncHandlerWithServices,
  ConcurrentOperations,
  ConcurrentResults
} from "./types";

// Import for convenience re-exports
import { ingress, transform, egress } from "./nodes";
import { service } from "./services";
import { pipeline } from "./pipeline";
import { run } from "./executor";

// Re-export common patterns for convenience
export const createNode = {
  ingress,
  transform,
  egress
};

export const createService = service;
export const createPipeline = pipeline;
export const runPipeline = run; 