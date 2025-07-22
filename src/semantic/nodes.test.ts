import { describe, it, expect } from "bun:test";
import { ingress, transform, egress, ingressWithServices, transformWithServices, egressWithServices } from "./nodes";

describe("Semantic Nodes", () => {
  describe("ingress()", () => {
    it("should create an ingress node", () => {
      const node = ingress("test-ingress", () => ({ data: "hello" }));
      
      expect(node.name).toBe("test-ingress");
      expect(node.kind).toBe("ingress");
      expect(node.handler).toBeFunction();
    });

    it("should execute handler correctly", async () => {
      const node = ingress("test-ingress", async () => ({ message: "test" }));
      const result = await node.handler(undefined);
      
      expect(result).toEqual({ message: "test" });
    });
  });

  describe("transform()", () => {
    it("should create a transform node", () => {
      const node = transform("test-transform", (input: any) => ({ processed: input }));
      
      expect(node.name).toBe("test-transform");
      expect(node.kind).toBe("transform");
      expect(node.handler).toBeFunction();
    });

    it("should execute handler correctly", async () => {
      const node = transform("test-transform", (input: { data: string }) => ({ 
        result: input.data.toUpperCase() 
      }));
      
      const result = await node.handler({ data: "hello" });
      expect(result).toEqual({ result: "HELLO" });
    });
  });

  describe("egress()", () => {
    it("should create an egress node", () => {
      const node = egress("test-egress", (input: any) => {
        console.log("Output:", input);
      });
      
      expect(node.name).toBe("test-egress");
      expect(node.kind).toBe("egress");
      expect(node.handler).toBeFunction();
    });

    it("should execute handler correctly", async () => {
      let captured: any = null;
      const node = egress("test-egress", (input: any) => {
        captured = input;
      });
      
      await node.handler({ data: "test" });
      expect(captured).toEqual({ data: "test" });
    });
  });

  describe("Service variants", () => {
    it("should create ingress with services", () => {
      const node = ingressWithServices("test-ingress", ["Logger"], (input, services) => {
        return { data: "hello" };
      });
      
      expect(node.name).toBe("test-ingress");
      expect(node.kind).toBe("ingress");
      expect(node.requiredServices).toEqual(["Logger"]);
    });

    it("should create transform with services", () => {
      const node = transformWithServices("test-transform", ["Database"], (input, services) => {
        return { processed: input };
      });
      
      expect(node.name).toBe("test-transform");
      expect(node.kind).toBe("transform");
      expect(node.requiredServices).toEqual(["Database"]);
    });

    it("should create egress with services", () => {
      const node = egressWithServices("test-egress", ["Logger"], (input, services) => {
        // Side effect
      });
      
      expect(node.name).toBe("test-egress");
      expect(node.kind).toBe("egress");
      expect(node.requiredServices).toEqual(["Logger"]);
    });
  });
}); 