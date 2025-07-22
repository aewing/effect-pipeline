import { describe, it, expect } from "bun:test";
import { mapJson } from "./mapJson";
import { NodeKind } from "../../core/node";

describe("mapJson", () => {
  it("should create a valid transform node", () => {
    const node = mapJson("test-transform", {
      transform: (input) => input
    });

    expect(node.kind).toBe(NodeKind.Transform);
    expect(node.name).toBe("test-transform");
  });

  it("should apply transform function to input", async () => {
    const node = mapJson("test-transform", {
      transform: (input: unknown) => (input as number) * 2
    });

    const result = await node.run(5);
    expect(result).toBe(10);
  });

  it("should handle object transformations", async () => {
    const node = mapJson("test-transform", {
      transform: (input: unknown) => ({
        ...(input as any),
        processed: true,
        timestamp: "2023-01-01"
      })
    });

    const input = { name: "test", value: 42 };
    const result = await node.run(input);

    expect(result).toEqual({
      name: "test",
      value: 42,
      processed: true,
      timestamp: "2023-01-01"
    });
  });

  it("should handle async transformations", async () => {
    const node = mapJson("test-transform", {
      transform: async (input: unknown) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return (input as number) + 1;
      }
    });

    const result = await node.run(5);
    expect(result).toBe(6);
  });

  it("should handle complex transformations", async () => {
    const node = mapJson("test-transform", {
      transform: (input: unknown) => {
        const arr = input as any[];
        return arr.filter(x => x > 5).map(x => x * 2);
      }
    });

    const input = [1, 3, 5, 7, 9];
    const result = await node.run(input);

    expect(result).toEqual([14, 18]);
  });
}); 