import { pipeline } from "../src/pipes/builder";
import { NodeKind, type Node, Effect } from "../src/core/node";

// Simple mock nodes for the example - now using Effect
const mockIngress: Node<undefined, { query: { name: string } }> = {
  kind: NodeKind.Ingress,
  name: "hello-ingress",
  run: () => Effect.succeed({ query: { name: "World" } })
};

const mockTransform: Node<{ query: { name: string } }, { message: string }> = {
  kind: NodeKind.Transform,
  name: "enrich-data",
  run: (input) => Effect.succeed({ message: `Hello ${input.query?.name || "World"}!` })
};

const mockEgress: Node<{ message: string }, void> = {
  kind: NodeKind.Egress,
  name: "hello-egress",
  run: (input) => 
    Effect.sync(() => {
      console.log("Response:", input);
    })
};

export default pipeline("hello-world")
  .from(mockIngress)
  .through(mockTransform)
  .to(mockEgress)
  .build(); 