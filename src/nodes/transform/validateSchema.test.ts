import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { NodeKind } from "../../core/node";
import { validateSchema, safeValidateSchema } from "./validateSchema";
import { Effect } from "effect";

describe("validateSchema()", () => {
  it("should create a valid transform node", () => {
    const schema = z.object({ name: z.string() });
    const node = validateSchema("test-validate", { schema });
    
    expect(node.kind).toBe(NodeKind.Transform);
    expect(node.name).toBe("test-validate");
    expect(node.run).toBeDefined();
  });

  it("should validate and pass through valid data", async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const node = validateSchema("test-validate", { schema });
    
    const input = { name: "John", age: 30 };
    const result = await Effect.runPromise(node.run(input));
    
    expect(result).toEqual(input);
  });

  it("should throw error for invalid data", async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const node = validateSchema("test-validate", { schema });
    
    const input = { name: "John", age: "thirty" }; // age should be number
    
    await expect(Effect.runPromise(node.run(input))).rejects.toThrow();
  });

  it("should use custom error message", async () => {
    const schema = z.string();
    const node = validateSchema("test-validate", { 
      schema, 
      errorMessage: "Custom validation error" 
    });
    
    await expect(Effect.runPromise(node.run(123))).rejects.toThrow("Custom validation error");
  });

  it("should handle complex nested schemas", async () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          email: z.string().email(),
          preferences: z.array(z.string())
        })
      })
    });
    
    const node = validateSchema("test-validate", { schema });
    
    const validInput = {
      user: {
        profile: {
          email: "test@example.com",
          preferences: ["dark-mode", "notifications"]
        }
      }
    };
    
    const result = await Effect.runPromise(node.run(validInput));
    expect(result).toEqual(validInput);
  });
});

describe("safeValidateSchema()", () => {
  it("should create a valid transform node", () => {
    const schema = z.object({ name: z.string() });
    const node = safeValidateSchema("test-safe-validate", { schema });
    
    expect(node.kind).toBe(NodeKind.Transform);
    expect(node.name).toBe("test-safe-validate");
    expect(node.run).toBeDefined();
  });

  it("should return success result for valid data", async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const node = safeValidateSchema("test-safe-validate", { schema });
    
    const input = { name: "John", age: 30 };
    const result = await Effect.runPromise(node.run(input));
    
    expect(result).toEqual({
      success: true,
      data: input
    });
  });

  it("should return error result for invalid data", async () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const node = safeValidateSchema("test-safe-validate", { schema });
    
    const input = { name: "John", age: "thirty" }; // age should be number
    const result = await Effect.runPromise(node.run(input));
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(z.ZodError);
    }
  });

  it("should handle array validation", async () => {
    const schema = z.array(z.object({ id: z.number(), title: z.string() }));
    const node = safeValidateSchema("test-safe-validate", { schema });
    
    const validInput = [
      { id: 1, title: "First" },
      { id: 2, title: "Second" }
    ];
    
    const result = await Effect.runPromise(node.run(validInput));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });
});