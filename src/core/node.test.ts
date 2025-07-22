import { describe, it, expect } from "bun:test";
import { NodeKind, type Node } from "./node";

describe("Node", () => {
  it("should have correct kind enum values", () => {
    expect(NodeKind.Ingress).toBe(NodeKind.Ingress);
    expect(NodeKind.Transform).toBe(NodeKind.Transform);
    expect(NodeKind.Egress).toBe(NodeKind.Egress);
    expect(NodeKind.Duplex).toBe(NodeKind.Duplex);
  });

  it("should create a valid ingress node", async () => {
    const node: Node<undefined, string> = {
      kind: NodeKind.Ingress,
      name: "test-ingress",
      run: async () => "hello"
    };

    expect(node.kind).toBe(NodeKind.Ingress);
    expect(node.name).toBe("test-ingress");
    
    const result = await node.run(undefined);
    expect(result).toBe("hello");
  });

  it("should create a valid transform node", async () => {
    const node: Node<string, number> = {
      kind: NodeKind.Transform,
      name: "test-transform",
      run: async (input) => input.length
    };

    expect(node.kind).toBe(NodeKind.Transform);
    expect(node.name).toBe("test-transform");
    
    const result = await node.run("hello");
    expect(result).toBe(5);
  });

  it("should create a valid egress node", async () => {
    const node: Node<string, void> = {
      kind: NodeKind.Egress,
      name: "test-egress",
      run: async (input) => {
        console.log(input);
      }
    };

    expect(node.kind).toBe(NodeKind.Egress);
    expect(node.name).toBe("test-egress");
    
    const result = await node.run("hello");
    expect(result).toBeUndefined();
  });
}); 