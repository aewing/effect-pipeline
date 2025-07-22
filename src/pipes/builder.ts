import type { Node } from "../core/node";
import type { Pipe } from "../core/pipe";

/**
 * A fluent builder for creating Pipes. It enforces that Nodes are connected
 * in a valid sequence: Ingress → Transform → Egress.
 */
export class PipelineBuilder {
  private nodes: Node<any, any, any, any>[] = [];

  constructor(private readonly name: string) {}

  /**
   * Add an Ingress Node to start the pipeline.
   */
  from(node: Node<any, any, any, any>): PipelineBuilder {
    if (node.kind !== "ingress") {
      throw new Error(`Expected ingress node, got ${node.kind}`);
    }
    this.nodes.push(node);
    return this;
  }

  /**
   * Add a Transform or Duplex Node to process data in the middle.
   */
  through(node: Node<any, any, any, any>): PipelineBuilder {
    if (node.kind !== "transform" && node.kind !== "duplex") {
      throw new Error(`Expected transform or duplex node, got ${node.kind}`);
    }
    this.nodes.push(node);
    return this;
  }

  /**
   * Add an Egress Node to end the pipeline.
   */
  to(node: Node<any, any, any, any>): PipelineBuilder {
    if (node.kind !== "egress") {
      throw new Error(`Expected egress node, got ${node.kind}`);
    }
    this.nodes.push(node);
    return this;
  }

  /**
   * Build the final Pipe.
   */
  build(): Pipe {
    if (this.nodes.length === 0) {
      throw new Error("Pipeline must have at least one node");
    }
    
    const firstNode = this.nodes[0];
    if (firstNode && firstNode.kind !== "ingress") {
      throw new Error("Pipeline must start with an ingress node");
    }
    
    const lastNode = this.nodes[this.nodes.length - 1];
    if (lastNode && lastNode.kind !== "egress") {
      throw new Error("Pipeline must end with an egress node");
    }

    return {
      name: this.name,
      nodes: this.nodes
    };
  }
}

/**
 * Start building a new pipeline with the given name.
 */
export function pipeline(name: string): PipelineBuilder {
  return new PipelineBuilder(name);
} 