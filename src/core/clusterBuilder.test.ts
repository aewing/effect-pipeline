import { describe, it, expect } from "bun:test";
import { cluster } from "./clusterBuilder";
import type { Deployment } from "./deployment";
import type { Pipe } from "./pipe";
import type { Node } from "./node";
import { NodeKind } from "./node";

// Mock helpers
const mockNode: Node<any, any> = {
  kind: NodeKind.Ingress,
  name: "mock-node",
  run: async () => "out"
};

const mockPipe: Pipe = {
  name: "mock-pipe",
  nodes: [mockNode]
};

const mockDeployment: Deployment = {
  name: "mock-deployment",
  pipe: mockPipe
};

describe("ClusterBuilder", () => {
  it("should build a valid cluster", () => {
    const built = cluster("test")
      .addDeployment(mockDeployment)
      .build();

    expect(built.name).toBe("test");
    expect(built.deployments).toHaveLength(1);
    expect(built.deployments[0]).toBe(mockDeployment);
  });

  it("should support multiple deployments and config", () => {
    const another: Deployment = { name: "another", pipe: mockPipe };

    const built = cluster("multi")
      .addDeployment(mockDeployment)
      .addDeployment(another)
      .withConfig({ env: "prod" })
      .build();

    expect(built.deployments).toHaveLength(2);
    expect(built.config?.env).toBe("prod");
  });

  it("should throw on empty name", () => {
    expect(() => cluster("").build()).toThrow();
  });
}); 