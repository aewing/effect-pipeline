import { describe, it, expect } from "bun:test";
import { batch } from "./batch";
import { NodeKind } from "../../core/node";

describe("batch", () => {
  it("should create a valid transform node", () => {
    const node = batch("test-batch", { size: 3 });

    expect(node.kind).toBe(NodeKind.Transform);
    expect(node.name).toBe("test-batch");
  });

  it("should return single item as array when batch size not reached", async () => {
    const node = batch("test-batch", { size: 3 });
    const result = await node.run("item1");

    expect(result).toEqual(["item1"]);
  });

  it("should handle different input types", async () => {
    const node = batch("test-batch", { size: 2 });

    const stringResult = await node.run("hello");
    expect(stringResult).toEqual(["hello"]);
  });

  it("should handle numbers", async () => {
    const node = batch("test-batch", { size: 2 });
    const numberResult = await node.run(42);
    expect(numberResult).toEqual([42]);
  });

  it("should handle objects", async () => {
    const node = batch("test-batch", { size: 2 });
    const objectResult = await node.run({ key: "value" });
    expect(objectResult).toEqual([{ key: "value" }]);
  });

  it("should handle null inputs", async () => {
    const node = batch("test-batch", { size: 2 });
    const nullResult = await node.run(null);
    expect(nullResult).toEqual([null]);
  });

  it("should handle undefined inputs", async () => {
    const node = batch("test-batch", { size: 2 });
    const undefinedResult = await node.run(undefined);
    expect(undefinedResult).toEqual([undefined]);
  });

  it("should work with timeout configuration", async () => {
    const node = batch("test-batch", { size: 3, timeout: 100 });
    const result = await node.run("item1");

    expect(result).toEqual(["item1"]);
  });

  it("should handle complex objects", async () => {
    const node = batch("test-batch", { size: 2 });
    const complexObject = {
      user: { id: 1, name: "John" },
      metadata: { timestamp: "2023-01-01", version: "1.0" },
      data: [1, 2, 3, 4, 5]
    };

    const result = await node.run(complexObject);
    expect(result).toEqual([complexObject]);
  });
}); 