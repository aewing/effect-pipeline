import { describe, it, expect } from "bun:test";
import type { Deployment } from "./deployment";
import type { Pipe } from "./pipe";
import type { Node } from "./node";
import { NodeKind } from "./node";

describe("Deployment", () => {
  const mockNode: Node<any, any> = {
    kind: NodeKind.Ingress,
    name: "test-node",
    run: async () => "test"
  };

  const mockPipe: Pipe = {
    name: "test-pipe",
    nodes: [mockNode]
  };

  it("should have correct structure", () => {
    const deployment: Deployment = {
      name: "test-deployment",
      pipe: mockPipe
    };

    expect(deployment.name).toBe("test-deployment");
    expect(deployment.pipe).toBe(mockPipe);
  });

  it("should support local strategy", () => {
    const deployment: Deployment = {
      name: "local-deployment",
      pipe: mockPipe,
      strategy: "local"
    };

    expect(deployment.strategy).toBe("local");
  });

  it("should work without strategy", () => {
    const deployment: Deployment = {
      name: "default-deployment",
      pipe: mockPipe
    };

    expect(deployment.strategy).toBeUndefined();
  });
}); 