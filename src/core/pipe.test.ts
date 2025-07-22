import { describe, it, expect } from "bun:test";
import type { Pipe } from "./pipe";
import type { Node } from "./node";
import { NodeKind } from "./node";

describe("Pipe", () => {
  const mockNode: Node<any, any> = {
    kind: NodeKind.Ingress,
    name: "test-node",
    run: async () => "test"
  };

  it("should have correct structure", () => {
    const pipe: Pipe = {
      name: "test-pipe",
      nodes: [mockNode]
    };

    expect(pipe.name).toBe("test-pipe");
    expect(pipe.nodes).toHaveLength(1);
    expect(pipe.nodes[0]).toBe(mockNode);
  });

  it("should support multiple nodes", () => {
    const mockNode2: Node<any, any> = {
      kind: NodeKind.Egress,
      name: "test-node-2",
      run: async () => "test2"
    };

    const pipe: Pipe = {
      name: "multi-node-pipe",
      nodes: [mockNode, mockNode2]
    };

    expect(pipe.nodes).toHaveLength(2);
    expect(pipe.nodes[0]).toBe(mockNode);
    expect(pipe.nodes[1]).toBe(mockNode2);
  });

  it("should support empty nodes array", () => {
    const pipe: Pipe = {
      name: "empty-pipe",
      nodes: []
    };

    expect(pipe.nodes).toHaveLength(0);
  });
}); 