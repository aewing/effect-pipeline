import { describe, it, expect } from "bun:test";
import { echo } from "./echo";
import { NodeKind } from "../../core/node";

describe("echo", () => {
  it("should create a valid duplex node", () => {
    const node = echo("test-echo", { prefix: "Echo: " });

    expect(node.kind).toBe(NodeKind.Duplex);
    expect(node.name).toBe("test-echo");
  });

  it("should echo input with default prefix", async () => {
    const node = echo("test-echo");
    const input = "Hello World";
    const result = await node.run(input);

    expect(result).toBe(input);
  });

  it("should echo input with custom prefix", async () => {
    const node = echo("test-echo", { prefix: "Custom: " });
    const input = "Hello World";
    const result = await node.run(input);

    expect(result).toBe(input);
  });

  it("should handle object input", async () => {
    const node = echo("test-echo");
    const input = { message: "Hello", data: [1, 2, 3] };
    const result = await node.run(input);

    expect(result).toEqual(input);
  });

  it("should handle array input", async () => {
    const node = echo("test-echo");
    const input = [1, 2, 3, 4, 5];
    const result = await node.run(input);

    expect(result).toEqual(input);
  });

  it("should handle null and undefined", async () => {
    const node = echo("test-echo");
    
    const nullResult = await node.run(null);
    expect(nullResult).toBeNull();
    
    const undefinedResult = await node.run(undefined);
    expect(undefinedResult).toBeUndefined();
  });

  it("should handle numbers and booleans", async () => {
    const node = echo("test-echo");
    
    const numberResult = await node.run(42);
    expect(numberResult).toBe(42);
    
    const booleanResult = await node.run(true);
    expect(booleanResult).toBe(true);
  });
}); 