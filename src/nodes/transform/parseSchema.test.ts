import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { NodeKind } from "../../core/node";
import { parseSchema, parseWithSchema } from "./parseSchema";
import { Effect } from "effect";

describe("parseSchema()", () => {
  it("should create a valid transform node", () => {
    const inputSchema = z.string();
    const outputSchema = z.number();
    const node = parseSchema("test-parse", { inputSchema, outputSchema });
    
    expect(node.kind).toBe(NodeKind.Transform);
    expect(node.name).toBe("test-parse");
    expect(node.run).toBeDefined();
  });

  it("should parse and transform data through schemas", async () => {
    const inputSchema = z.string();
    const outputSchema = z.number();
    const node = parseSchema("test-parse", { 
      inputSchema, 
      outputSchema,
      transform: (str: string) => parseInt(str, 10)
    });
    
    const result = await Effect.runPromise(node.run("42"));
    expect(result).toBe(42);
  });

  it("should handle preprocessing of input", async () => {
    const inputSchema = z.object({ value: z.string() });
    const outputSchema = z.object({ value: z.number() });
    const node = parseSchema("test-parse", {
      inputSchema,
      outputSchema,
      preprocessor: (input: unknown) => {
        if (typeof input === "string") {
          return { value: input };
        }
        return input;
      },
      transform: (data) => ({ value: parseInt(data.value, 10) })
    });
    
    const result = await Effect.runPromise(node.run("123"));
    expect(result).toEqual({ value: 123 });
  });

  it("should handle async transformations", async () => {
    const inputSchema = z.object({ url: z.string() });
    const outputSchema = z.object({ url: z.string(), processed: z.boolean() });
    
    const node = parseSchema("test-parse", {
      inputSchema,
      outputSchema,
      transform: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async work
        return { ...data, processed: true };
      }
    });
    
    const input = { url: "https://example.com" };
    const result = await Effect.runPromise(node.run(input));
    expect(result).toEqual({ url: "https://example.com", processed: true });
  });

  it("should fail when input doesn't match input schema", async () => {
    const inputSchema = z.object({ name: z.string() });
    const outputSchema = z.object({ name: z.string(), processed: z.boolean() });
    const node = parseSchema("test-parse", { inputSchema, outputSchema });
    
    await expect(Effect.runPromise(node.run({ age: 30 }))).rejects.toThrow();
  });

  it("should fail when output doesn't match output schema", async () => {
    const inputSchema = z.string();
    const outputSchema = z.number();
    const node = parseSchema("test-parse", {
      inputSchema,
      outputSchema,
      transform: (str: string) => str // Returns string instead of number
    });
    
    await expect(Effect.runPromise(node.run("hello"))).rejects.toThrow();
  });
});

describe("parseWithSchema()", () => {
  it("should create a valid transform node", () => {
    const schema = z.object({ name: z.string() });
    const node = parseWithSchema("test-simple-parse", schema);
    
    expect(node.kind).toBe(NodeKind.Transform);
    expect(node.name).toBe("test-simple-parse");
    expect(node.run).toBeDefined();
  });

  it("should parse simple data with schema", async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const node = parseWithSchema("test-simple-parse", schema);
    
    const input = { name: "Alice", age: 25 };
    const result = await Effect.runPromise(node.run(input));
    expect(result).toEqual(input);
  });

  it("should use preprocessor when provided", async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const node = parseWithSchema("test-simple-parse", schema, {
      preprocessor: (input: unknown) => {
        if (typeof input === "string") {
          const parsed = JSON.parse(input);
          return parsed;
        }
        return input;
      }
    });
    
    const jsonString = '{"name":"Bob","age":30}';
    const result = await Effect.runPromise(node.run(jsonString));
    expect(result).toEqual({ name: "Bob", age: 30 });
  });

  it("should use custom error message", async () => {
    const schema = z.number();
    const node = parseWithSchema("test-simple-parse", schema, {
      errorMessage: "Custom parse error"
    });
    
    await expect(Effect.runPromise(node.run("not-a-number"))).rejects.toThrow("Custom parse error");
  });

  it("should handle array schemas", async () => {
    const schema = z.array(z.object({ id: z.number(), name: z.string() }));
    const node = parseWithSchema("test-simple-parse", schema);
    
    const input = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" }
    ];
    
    const result = await Effect.runPromise(node.run(input));
    expect(result).toEqual(input);
  });

  it("should handle union schemas", async () => {
    const schema = z.union([z.string(), z.number()]);
    const node = parseWithSchema("test-simple-parse", schema);
    
    const stringResult = await Effect.runPromise(node.run("hello"));
    expect(stringResult).toBe("hello");
    
    const numberResult = await Effect.runPromise(node.run(42));
    expect(numberResult).toBe(42);
  });
});