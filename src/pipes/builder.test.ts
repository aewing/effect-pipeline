import { describe, it, expect } from "bun:test";
import { pipeline } from "./builder";
import { NodeKind, type Node } from "../core/node";

describe("PipelineBuilder", () => {
  const mockIngress: Node<any, any> = {
    kind: NodeKind.Ingress,
    name: "test-ingress",
    run: async () => "hello"
  };

  const mockTransform: Node<any, any> = {
    kind: NodeKind.Transform,
    name: "test-transform",
    run: async (input) => input.length
  };

  const mockEgress: Node<any, any> = {
    kind: NodeKind.Egress,
    name: "test-egress",
    run: async (input) => {
      console.log(input);
    }
  };

  it("should build a valid pipeline", () => {
    const pipe = pipeline("test-pipeline")
      .from(mockIngress)
      .through(mockTransform)
      .to(mockEgress)
      .build();

    expect(pipe.name).toBe("test-pipeline");
    expect(pipe.nodes).toHaveLength(3);
    expect(pipe.nodes[0]).toBe(mockIngress);
    expect(pipe.nodes[1]).toBe(mockTransform);
    expect(pipe.nodes[2]).toBe(mockEgress);
  });

  it("should reject pipeline without ingress", () => {
    expect(() => {
      pipeline("test-pipeline")
        .through(mockTransform)
        .to(mockEgress)
        .build();
    }).toThrow("Pipeline must start with an ingress node");
  });

  it("should reject pipeline without egress", () => {
    expect(() => {
      pipeline("test-pipeline")
        .from(mockIngress)
        .through(mockTransform)
        .build();
    }).toThrow("Pipeline must end with an egress node");
  });

  it("should reject empty pipeline", () => {
    expect(() => {
      pipeline("test-pipeline").build();
    }).toThrow("Pipeline must have at least one node");
  });

  it("should reject wrong node types in from()", () => {
    expect(() => {
      pipeline("test-pipeline")
        .from(mockTransform) // Wrong: transform instead of ingress
        .to(mockEgress)
        .build();
    }).toThrow("Expected ingress node, got transform");
  });

  it("should reject wrong node types in to()", () => {
    expect(() => {
      pipeline("test-pipeline")
        .from(mockIngress)
        .to(mockTransform) // Wrong: transform instead of egress
        .build();
    }).toThrow("Expected egress node, got transform");
  });
}); 