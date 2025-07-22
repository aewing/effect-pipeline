import { describe, it, expect } from "bun:test";
import type {
  AsyncHandler,
  AsyncHandlerWithServices,
  SemanticService,
  SemanticNode,
  SemanticPipeline,
  SemanticPipelineBuilder,
  SemanticPipelineBuilderWithStart,
  ConcurrentOperations,
  ConcurrentResults
} from "./types";

describe("Semantic Types", () => {
  describe("AsyncHandler", () => {
    it("should accept sync function returning value", () => {
      const syncHandler: AsyncHandler<string, number> = (input: string) => input.length;
      expect(syncHandler("hello")).toBe(5);
    });

    it("should accept async function returning Promise", async () => {
      const asyncHandler: AsyncHandler<string, number> = async (input: string) => {
        return Promise.resolve(input.length);
      };
      const result = await asyncHandler("hello");
      expect(result).toBe(5);
    });
  });

  describe("AsyncHandlerWithServices", () => {
    it("should accept handler with services parameter", async () => {
      const handler: AsyncHandlerWithServices<string, number, { math: { multiply: (x: number) => number } }> = 
        async (input: string, services) => {
          const length = input.length;
          return services.math.multiply(length);
        };

      const mockServices = {
        math: {
          multiply: (x: number) => x * 2
        }
      };

      const result = await handler("hello", mockServices);
      expect(result).toBe(10); // 5 * 2
    });
  });

  describe("SemanticService", () => {
    it("should define service structure correctly", () => {
      const testService: SemanticService = {
        name: "TestService",
        implementation: {
          getData: async () => ({ data: "test" }),
          saveData: (data: any) => ({ id: "123", saved: data })
        }
      };

      expect(testService.name).toBe("TestService");
      expect(testService.implementation.getData).toBeFunction();
      expect(testService.implementation.saveData).toBeFunction();
    });
  });

  describe("SemanticNode", () => {
    it("should define ingress node structure", () => {
      const ingressNode: SemanticNode<undefined, { data: string }> = {
        name: "test-ingress",
        kind: "ingress",
        handler: () => ({ data: "hello" })
      };

      expect(ingressNode.name).toBe("test-ingress");
      expect(ingressNode.kind).toBe("ingress");
      expect(ingressNode.handler).toBeFunction();
    });

    it("should define transform node structure", () => {
      const transformNode: SemanticNode<{ data: string }, { processed: string }> = {
        name: "test-transform",
        kind: "transform",
        handler: (input) => ({ processed: input.data.toUpperCase() })
      };

      expect(transformNode.name).toBe("test-transform");
      expect(transformNode.kind).toBe("transform");
      expect(transformNode.handler).toBeFunction();
    });

    it("should define egress node structure", () => {
      const egressNode: SemanticNode<{ data: string }, void> = {
        name: "test-egress",
        kind: "egress",
        handler: (input) => {
          console.log("Processing:", input.data);
        }
      };

      expect(egressNode.name).toBe("test-egress");
      expect(egressNode.kind).toBe("egress");
      expect(egressNode.handler).toBeFunction();
    });

    it("should support required services", () => {
      const nodeWithServices: SemanticNode = {
        name: "test-with-services",
        kind: "transform",
        handler: (input, services) => ({ processed: input }),
        requiredServices: ["Database", "Logger"]
      };

      expect(nodeWithServices.requiredServices).toEqual(["Database", "Logger"]);
    });
  });

  describe("SemanticPipeline", () => {
    it("should define pipeline structure correctly", () => {
      const mockNode: SemanticNode = {
        name: "test-node",
        kind: "ingress",
        handler: () => ({ data: "test" })
      };

      const mockService: SemanticService = {
        name: "TestService",
        implementation: { test: () => "test" }
      };

      const pipeline: SemanticPipeline = {
        name: "test-pipeline",
        nodes: [mockNode],
        services: [mockService]
      };

      expect(pipeline.name).toBe("test-pipeline");
      expect(pipeline.nodes).toHaveLength(1);
      expect(pipeline.services).toHaveLength(1);
      expect(pipeline.nodes[0]).toBe(mockNode);
      expect(pipeline.services[0]).toBe(mockService);
    });
  });

  describe("ConcurrentOperations and ConcurrentResults", () => {
    it("should type concurrent operations correctly", () => {
      const operations: ConcurrentOperations = {
        task1: Promise.resolve("result1"),
        task2: Promise.resolve(42),
        task3: Promise.resolve({ data: "test" })
      };

      expect(operations.task1).toBeInstanceOf(Promise);
      expect(operations.task2).toBeInstanceOf(Promise);
      expect(operations.task3).toBeInstanceOf(Promise);
    });

    it("should type concurrent results correctly", async () => {
      const operations = {
        stringResult: Promise.resolve("hello"),
        numberResult: Promise.resolve(42),
        objectResult: Promise.resolve({ key: "value" })
      };

      // This simulates what ConcurrentResults<typeof operations> would look like
      const results = await Promise.all([
        operations.stringResult,
        operations.numberResult,
        operations.objectResult
      ]);

      const typedResults = {
        stringResult: results[0],
        numberResult: results[1],
        objectResult: results[2]
      };

      expect(typedResults.stringResult).toBe("hello");
      expect(typedResults.numberResult).toBe(42);
      expect(typedResults.objectResult).toEqual({ key: "value" });
    });
  });
}); 