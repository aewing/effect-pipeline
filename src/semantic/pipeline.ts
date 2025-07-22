// Semantic pipeline builder for intuitive pipeline creation
// Provides a fluent API that feels natural to async/await developers

import type { 
  SemanticPipeline, 
  SemanticPipelineBuilder, 
  SemanticPipelineBuilderWithStart,
  SemanticNode, 
  SemanticService 
} from "./types";
import { validateServices } from "./services";

class SemanticPipelineBuilderImpl implements SemanticPipelineBuilder, SemanticPipelineBuilderWithStart {
  private nodes: SemanticNode[] = [];
  private services: SemanticService[] = [];

  constructor(private readonly name: string) {}

  /**
   * Add services that will be available to nodes in the pipeline.
   * Services provide dependency injection for reusable functionality.
   */
  with(...services: SemanticService[]): SemanticPipelineBuilder {
    this.services.push(...services);
    return this;
  }

  /**
   * Set the ingress node that starts the pipeline.
   * Must be called before any transform or egress nodes.
   */
  start(node: SemanticNode): SemanticPipelineBuilderWithStart {
    if (node.kind !== "ingress") {
      throw new Error(`Expected ingress node for start(), got ${node.kind}`);
    }
    
    this.validateNodeServices(node);
    this.nodes.push(node);
    return this;
  }

  /**
   * Add a transform node that processes data in the middle of the pipeline.
   * Can be called multiple times to chain transforms.
   */
  then(node: SemanticNode): SemanticPipelineBuilderWithStart {
    if (node.kind !== "transform") {
      throw new Error(`Expected transform node for then(), got ${node.kind}`);
    }
    
    this.validateNodeServices(node);
    this.nodes.push(node);
    return this;
  }

  /**
   * Set the egress node that ends the pipeline.
   * Must be the final call in the pipeline building chain.
   */
  end(node: SemanticNode): SemanticPipeline {
    if (node.kind !== "egress") {
      throw new Error(`Expected egress node for end(), got ${node.kind}`);
    }
    
    this.validateNodeServices(node);
    this.nodes.push(node);

    return {
      name: this.name,
      nodes: [...this.nodes],
      services: [...this.services]
    };
  }

  /**
   * Validate that all services required by a node are available.
   */
  private validateNodeServices(node: SemanticNode): void {
    if (node.requiredServices && node.requiredServices.length > 0) {
      validateServices(node.requiredServices, this.services);
    }
  }
}

/**
 * Create a new semantic pipeline builder.
 * Provides a fluent API for building pipelines with services and nodes.
 * 
 * @param name - Unique name for the pipeline
 * @returns Pipeline builder for chaining
 * 
 * @example
 * ```typescript
 * const myPipeline = pipeline("my-pipeline")
 *   .with(database, logger)
 *   .start(ingressNode)
 *   .then(transformNode)
 *   .end(egressNode);
 * ```
 */
export function pipeline(name: string): SemanticPipelineBuilder {
  return new SemanticPipelineBuilderImpl(name);
} 