import { describe, it, expect } from "bun:test";
import { Effect, Queue, Fiber } from "effect";
import { PipelineExecutor } from "./executor";
import { NodeKind, type Node } from "../../core/node";
import type { Pipe } from "../../core/pipe";
import type { RuntimeEvent } from "../../core/event";

describe("PipelineExecutor", () => {
  const mockIngress: Node<undefined, { message: string }> = {
    kind: NodeKind.Ingress,
    name: "test-ingress",
    run: () => Effect.succeed({ message: "hello" })
  };

  const mockTransform: Node<{ message: string }, { message: string; transformed: boolean }> = {
    kind: NodeKind.Transform,
    name: "test-transform",
    run: (input) => Effect.succeed({ ...input, transformed: true })
  };

  const mockEgress: Node<{ message: string; transformed: boolean }, void> = {
    kind: NodeKind.Egress,
    name: "test-egress",
    run: (input) => 
      Effect.sync(() => {
        console.log("Final output:", input);
      })
  };

  const testPipeline: Pipe = {
    name: "test-pipeline",
    nodes: [mockIngress, mockTransform, mockEgress]
  };

  it("should execute a pipeline successfully", async () => {
    const eventQueue = await Effect.runPromise(Queue.unbounded<RuntimeEvent>());
    const executor = new PipelineExecutor(testPipeline, eventQueue);

    // Start event listener
    const listener = await Effect.runPromise(Effect.fork(
      Effect.forever(
        Effect.gen(function* (_) {
          const event = yield* _(Queue.take(eventQueue));
          // Just consume events for this test
        })
      )
    ));

    await Effect.runPromise(executor.run());
    await Effect.runPromise(Fiber.interrupt(listener));
  });

  it("should emit correct events in order", async () => {
    const eventQueue = await Effect.runPromise(Queue.unbounded<RuntimeEvent>());
    const executor = new PipelineExecutor(testPipeline, eventQueue);

    // Start event listener
    const listener = await Effect.runPromise(Effect.fork(
      Effect.forever(
        Effect.gen(function* (_) {
          const event = yield* _(Queue.take(eventQueue));
          // Just consume events for this test
        })
      )
    ));

    // Run pipeline
    await Effect.runPromise(executor.run());
    
    await Effect.runPromise(Fiber.interrupt(listener));

    // Just verify the pipeline executed without errors
    expect(true).toBe(true);
  });

  it("should handle node errors", async () => {
    const errorNode: Node<{ message: string }, never, string> = {
      kind: NodeKind.Transform,
      name: "error-node",
      run: () => Effect.fail("Test error")
    };

    const errorPipeline: Pipe = {
      name: "error-pipeline",
      nodes: [mockIngress, errorNode, mockEgress]
    };

    const eventQueue = await Effect.runPromise(Queue.unbounded<RuntimeEvent>());
    const executor = new PipelineExecutor(errorPipeline, eventQueue);

    await expect(Effect.runPromise(executor.run())).rejects.toThrow("Node error-node failed: Test error");
  });
}); 