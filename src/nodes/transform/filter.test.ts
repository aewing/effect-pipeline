import { describe, it, expect } from "bun:test";
import { filter } from "./filter";
import { NodeKind } from "../../core/node";

describe("filter", () => {
  it("should create a valid transform node", () => {
    const node = filter("test-filter", {
      predicate: (input) => true
    });

    expect(node.kind).toBe(NodeKind.Transform);
    expect(node.name).toBe("test-filter");
  });

  it("should pass through data when predicate is true", async () => {
    const node = filter("test-filter", {
      predicate: (input: unknown) => (input as number) > 5
    });

    const result = await node.run(10);
    expect(result).toBe(10);
  });

  it("should filter out data when predicate is false", async () => {
    const node = filter("test-filter", {
      predicate: (input: unknown) => (input as number) > 5
    });

    await expect(node.run(3)).rejects.toThrow("Data filtered out by test-filter");
  });

  it("should handle object filtering", async () => {
    const node = filter("test-filter", {
      predicate: (input: unknown) => (input as any).active === true
    });

    const activeUser = { id: 1, name: "John", active: true };
    const inactiveUser = { id: 2, name: "Jane", active: false };

    const activeResult = await node.run(activeUser);
    expect(activeResult).toEqual(activeUser);

    await expect(node.run(inactiveUser)).rejects.toThrow("Data filtered out by test-filter");
  });

  it("should handle array filtering", async () => {
    const node = filter("test-filter", {
      predicate: (input: unknown) => (input as any[]).length > 0
    });

    const nonEmptyArray = [1, 2, 3];
    const emptyArray: any[] = [];

    const nonEmptyResult = await node.run(nonEmptyArray);
    expect(nonEmptyResult).toEqual(nonEmptyArray);

    await expect(node.run(emptyArray)).rejects.toThrow("Data filtered out by test-filter");
  });

  it("should handle complex predicate logic", async () => {
    const node = filter("test-filter", {
      predicate: (input: unknown) => {
        const obj = input as any;
        return obj.age >= 18 && obj.score >= 80;
      }
    });

    const validUser = { name: "John", age: 25, score: 85 };
    const invalidUser = { name: "Jane", age: 16, score: 90 };

    const validResult = await node.run(validUser);
    expect(validResult).toEqual(validUser);

    await expect(node.run(invalidUser)).rejects.toThrow("Data filtered out by test-filter");
  });
}); 