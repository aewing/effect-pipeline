import { describe, it, expect } from "bun:test";
import type { Cluster } from "./cluster";
import type { Deployment } from "./deployment";
import type { Pipe } from "./pipe";
import type { Node } from "./node";
import { NodeKind } from "./node";

describe("Cluster", () => {
  const mockNode: Node<any, any> = {
    kind: NodeKind.Ingress,
    name: "test-node",
    run: async () => "test"
  };

  const mockPipe: Pipe = {
    name: "test-pipe",
    nodes: [mockNode]
  };

  const mockDeployment: Deployment = {
    name: "test-deployment",
    pipe: mockPipe
  };

  it("should have correct structure", () => {
    const cluster: Cluster = {
      name: "test-cluster",
      deployments: [mockDeployment]
    };

    expect(cluster.name).toBe("test-cluster");
    expect(cluster.deployments).toHaveLength(1);
    expect(cluster.deployments[0]).toBe(mockDeployment);
  });

  it("should support multiple deployments", () => {
    const mockDeployment2: Deployment = {
      name: "test-deployment-2",
      pipe: mockPipe
    };

    const cluster: Cluster = {
      name: "multi-deployment-cluster",
      deployments: [mockDeployment, mockDeployment2]
    };

    expect(cluster.deployments).toHaveLength(2);
    expect(cluster.deployments[0]).toBe(mockDeployment);
    expect(cluster.deployments[1]).toBe(mockDeployment2);
  });

  it("should support configuration", () => {
    const cluster: Cluster = {
      name: "configured-cluster",
      deployments: [mockDeployment],
      config: {
        environment: "production",
        region: "us-west-2"
      }
    };

    expect(cluster.config?.environment).toBe("production");
    expect(cluster.config?.region).toBe("us-west-2");
  });

  it("should work without configuration", () => {
    const cluster: Cluster = {
      name: "simple-cluster",
      deployments: [mockDeployment]
    };

    expect(cluster.config).toBeUndefined();
  });
}); 