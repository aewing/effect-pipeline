import { describe, it, expect } from "bun:test";
import { Queue, Effect } from "effect";
import type { Node } from "../core/node";
import { NodeKind } from "../core/node";
import type { Pipe } from "../core/pipe";
import type { Deployment } from "../core/deployment";
import type { Cluster } from "../core/cluster";
import { Orchestrator } from "./orchestrator";
import type { RuntimeEvent } from "../core/event";

// Helper to create trivial pipeline with single node
function makeDeployment(name: string): Deployment {
  const node: Node<undefined, string> = {
    kind: NodeKind.Ingress,
    name: `${name}-node`,
    run: () => Effect.succeed("hello")
  };

  const pipe: Pipe = {
    name: `${name}-pipe`,
    nodes: [node]
  };

  return {
    name,
    pipe
  };
}

describe("Orchestrator", () => {
  it("should execute all deployments in a cluster", async () => {
    const deploymentA = makeDeployment("A");
    const deploymentB = makeDeployment("B");

    const cluster: Cluster = {
      name: "test-cluster",
      deployments: [deploymentA, deploymentB]
    };

    const eventQueue = await Effect.runPromise(Queue.unbounded<RuntimeEvent>());
    const orchestrator = new Orchestrator(cluster, eventQueue);

    await expect(Effect.runPromise(orchestrator.run())).resolves.toBeUndefined();
  });
}); 