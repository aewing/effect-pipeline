import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { NodeKind } from "../../core/node";
import { refineSchema, conditionalSchema, transformWithSchema } from "./refineSchema";
import { Effect } from "effect";

describe("refineSchema()", () => {
  it("should create a valid transform node", () => {
    const schema = z.object({ age: z.number() });
    const node = refineSchema("test-refine", {
      schema,
      refinements: [{
        check: (data) => data.age >= 18,
        message: "Must be 18 or older"
      }]
    });
    
    expect(node.kind).toBe(NodeKind.Transform);
    expect(node.name).toBe("test-refine");
    expect(node.run).toBeDefined();
  });

  it("should pass data that meets all refinements", async () => {
    const schema = z.object({ age: z.number(), email: z.string() });
    const node = refineSchema("test-refine", {
      schema,
      refinements: [
        {
          check: (data) => data.age >= 18,
          message: "Must be 18 or older"
        },
        {
          check: (data) => data.email.includes("@"),
          message: "Email must contain @"
        }
      ]
    });
    
    const input = { age: 25, email: "test@example.com" };
    const result = await Effect.runPromise(node.run(input));
    expect(result).toEqual(input);
  });

  it("should fail when refinement check fails", async () => {
    const schema = z.object({ age: z.number() });
    const node = refineSchema("test-refine", {
      schema,
      refinements: [{
        check: (data) => data.age >= 18,
        message: "Must be 18 or older"
      }]
    });
    
    const input = { age: 16 };
    await expect(Effect.runPromise(node.run(input))).rejects.toThrow("Must be 18 or older");
  });

  it("should handle async refinement checks", async () => {
    const schema = z.object({ username: z.string() });
    const node = refineSchema("test-refine", {
      schema,
      refinements: [{
        check: async (data) => {
          // Simulate async validation like checking if username exists
          await new Promise(resolve => setTimeout(resolve, 10));
          return data.username !== "admin";
        },
        message: "Username 'admin' is reserved"
      }]
    });
    
    const validInput = { username: "user123" };
    const result = await Effect.runPromise(node.run(validInput));
    expect(result).toEqual(validInput);
    
    const invalidInput = { username: "admin" };
    await expect(Effect.runPromise(node.run(invalidInput))).rejects.toThrow("Username 'admin' is reserved");
  });

  it("should include path in refinement errors", async () => {
    const schema = z.object({ nested: z.object({ value: z.number() }) });
    const node = refineSchema("test-refine", {
      schema,
      refinements: [{
        check: (data) => data.nested.value > 0,
        message: "Value must be positive",
        path: ["nested", "value"]
      }]
    });
    
    const input = { nested: { value: -5 } };
    await expect(Effect.runPromise(node.run(input))).rejects.toThrow("Value must be positive");
  });

  it("should use custom error message for schema failures", async () => {
    const schema = z.object({ name: z.string() });
    const node = refineSchema("test-refine", {
      schema,
      refinements: [],
      errorMessage: "Custom schema error"
    });
    
    await expect(Effect.runPromise(node.run({ name: 123 }))).rejects.toThrow("Custom schema error");
  });
});

describe("conditionalSchema()", () => {
  it("should create a valid transform node", () => {
    const trueSchema = z.object({ type: z.literal("A"), valueA: z.string() });
    const falseSchema = z.object({ type: z.literal("B"), valueB: z.number() });
    const node = conditionalSchema("test-conditional", {
      condition: (input: any) => input.type === "A",
      trueSchema,
      falseSchema
    });
    
    expect(node.kind).toBe(NodeKind.Transform);
    expect(node.name).toBe("test-conditional");
    expect(node.run).toBeDefined();
  });

  it("should use trueSchema when condition is true", async () => {
    const trueSchema = z.object({ type: z.literal("user"), name: z.string() });
    const falseSchema = z.object({ type: z.literal("admin"), permissions: z.array(z.string()) });
    const node = conditionalSchema("test-conditional", {
      condition: (input: any) => input.type === "user",
      trueSchema,
      falseSchema
    });
    
    const input = { type: "user", name: "John" };
    const result = await Effect.runPromise(node.run(input));
    expect(result).toEqual(input);
  });

  it("should use falseSchema when condition is false", async () => {
    const trueSchema = z.object({ type: z.literal("user"), name: z.string() });
    const falseSchema = z.object({ type: z.literal("admin"), permissions: z.array(z.string()) });
    const node = conditionalSchema("test-conditional", {
      condition: (input: any) => input.type === "user",
      trueSchema,
      falseSchema
    });
    
    const input = { type: "admin", permissions: ["read", "write"] };
    const result = await Effect.runPromise(node.run(input));
    expect(result).toEqual(input);
  });

  it("should fail when data doesn't match selected schema", async () => {
    const trueSchema = z.object({ type: z.literal("A"), value: z.string() });
    const falseSchema = z.object({ type: z.literal("B"), value: z.number() });
    const node = conditionalSchema("test-conditional", {
      condition: (input: any) => input.type === "A",
      trueSchema,
      falseSchema
    });
    
    // Condition is true but data doesn't match trueSchema
    const input = { type: "A", value: 123 }; // value should be string
    await expect(Effect.runPromise(node.run(input))).rejects.toThrow();
  });
});

describe("transformWithSchema()", () => {
  it("should create a valid transform node", () => {
    const inputSchema = z.string();
    const outputSchema = z.number();
    const node = transformWithSchema(
      "test-transform-schema",
      inputSchema,
      outputSchema,
      (str) => parseInt(str, 10)
    );
    
    expect(node.kind).toBe(NodeKind.Transform);
    expect(node.name).toBe("test-transform-schema");
    expect(node.run).toBeDefined();
  });

  it("should validate input, transform, and validate output", async () => {
    const inputSchema = z.object({ value: z.string() });
    const outputSchema = z.object({ value: z.number(), doubled: z.number() });
    const node = transformWithSchema(
      "test-transform-schema",
      inputSchema,
      outputSchema,
      (input) => ({
        value: parseInt(input.value, 10),
        doubled: parseInt(input.value, 10) * 2
      })
    );
    
    const input = { value: "21" };
    const result = await Effect.runPromise(node.run(input));
    expect(result).toEqual({ value: 21, doubled: 42 });
  });

  it("should handle async transformations", async () => {
    const inputSchema = z.object({ url: z.string() });
    const outputSchema = z.object({ url: z.string(), fetched: z.boolean() });
    const node = transformWithSchema(
      "test-transform-schema",
      inputSchema,
      outputSchema,
      async (input) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { url: input.url, fetched: true };
      }
    );
    
    const input = { url: "https://api.example.com" };
    const result = await Effect.runPromise(node.run(input));
    expect(result).toEqual({ url: "https://api.example.com", fetched: true });
  });

  it("should fail when input doesn't match input schema", async () => {
    const inputSchema = z.object({ name: z.string() });
    const outputSchema = z.object({ name: z.string(), processed: z.boolean() });
    const node = transformWithSchema(
      "test-transform-schema",
      inputSchema,
      outputSchema,
      (input) => ({ ...input, processed: true })
    );
    
    await expect(Effect.runPromise(node.run({ age: 30 }))).rejects.toThrow();
  });

  it("should fail when transform output doesn't match output schema", async () => {
    const inputSchema = z.string();
    const outputSchema = z.number();
    const node = transformWithSchema(
      "test-transform-schema",
      inputSchema,
      outputSchema,
      (input) => input // Returns string instead of number
    );
    
    await expect(Effect.runPromise(node.run("hello"))).rejects.toThrow();
  });

  it("should handle complex nested transformations", async () => {
    const inputSchema = z.object({
      users: z.array(z.object({ name: z.string(), age: z.number() }))
    });
    const outputSchema = z.object({
      adults: z.array(z.object({ name: z.string(), age: z.number() })),
      count: z.number()
    });
    
    const node = transformWithSchema(
      "test-transform-schema",
      inputSchema,
      outputSchema,
      (input) => {
        const adults = input.users.filter(user => user.age >= 18);
        return { adults, count: adults.length };
      }
    );
    
    const input = {
      users: [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 16 },
        { name: "Charlie", age: 30 }
      ]
    };
    
    const result = await Effect.runPromise(node.run(input));
    expect(result).toEqual({
      adults: [
        { name: "Alice", age: 25 },
        { name: "Charlie", age: 30 }
      ],
      count: 2
    });
  });
});