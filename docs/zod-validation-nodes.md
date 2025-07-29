# Zod Schema Validation Transformer Nodes

This document describes the Zod schema validation transformer nodes available in the Effect Pipeline framework. These nodes provide runtime type checking and data validation using [Zod](https://zod.dev/), a TypeScript-first schema validation library.

## Overview

The Zod validation transformer nodes allow you to:
- Validate input data against Zod schemas
- Parse and transform data with type safety
- Add custom business logic refinements
- Handle conditional validation based on data content
- Provide safe validation with detailed error handling

## Available Nodes

### 1. `validateSchema` and `safeValidateSchema`

Basic schema validation nodes that validate input data against a Zod schema.

```typescript
import { z } from "zod";
import { validateSchema, safeValidateSchema } from "../src/nodes";

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(18)
});

// Throws on validation failure
const validateUser = validateSchema("validate-user", {
  schema: UserSchema,
  errorMessage: "Invalid user data"
});

// Returns result object with success/error information
const safeValidateUser = safeValidateSchema("safe-validate-user", {
  schema: UserSchema
});
```

### 2. `parseSchema` and `parseWithSchema`

Nodes that parse input with one schema, optionally transform it, and validate output with another schema.

```typescript
import { z } from "zod";
import { parseSchema, parseWithSchema } from "../src/nodes";

// Parse and transform between different schemas
const convertUserData = parseSchema("convert-user", {
  inputSchema: z.object({ name: z.string(), age: z.string() }),
  outputSchema: z.object({ name: z.string(), age: z.number() }),
  transform: (input) => ({
    name: input.name,
    age: parseInt(input.age, 10)
  })
});

// Simple parsing with optional preprocessing
const parseUser = parseWithSchema("parse-user", UserSchema, {
  preprocessor: (input) => {
    // Convert string to object if needed
    return typeof input === "string" ? JSON.parse(input) : input;
  },
  errorMessage: "Failed to parse user data"
});
```

### 3. `refineSchema` and `conditionalSchema`

Advanced validation nodes for complex business logic and conditional validation.

```typescript
import { z } from "zod";
import { refineSchema, conditionalSchema } from "../src/nodes";

// Add custom business logic refinements
const refineUser = refineSchema("refine-user", {
  schema: UserSchema,
  refinements: [
    {
      check: (data) => data.age >= 18,
      message: "User must be at least 18 years old"
    },
    {
      check: async (data) => {
        // Async validation (e.g., check if email exists)
        return !await emailExists(data.email);
      },
      message: "Email already exists",
      path: ["email"]
    }
  ]
});

// Conditional validation based on data content
const validateByType = conditionalSchema("validate-by-type", {
  condition: (input: any) => input.type === "premium",
  trueSchema: z.object({ 
    type: z.literal("premium"), 
    features: z.array(z.string()).min(1) 
  }),
  falseSchema: z.object({ 
    type: z.literal("basic"), 
    features: z.array(z.string()).max(3) 
  })
});
```

### 4. `transformWithSchema`

A node that validates input, applies transformation, and validates output with full type safety.

```typescript
import { z } from "zod";
import { transformWithSchema } from "../src/nodes";

const enrichUser = transformWithSchema(
  "enrich-user",
  z.object({ name: z.string(), email: z.string() }), // Input schema
  z.object({ // Output schema
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    createdAt: z.date(),
    slug: z.string()
  }),
  async (input) => ({
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    createdAt: new Date(),
    slug: input.name.toLowerCase().replace(/\s+/g, '-')
  })
);
```

## Usage in Pipelines

### Core API

```typescript
import { pipe } from "../src/pipes/builder";
import { validateSchema } from "../src/nodes";

const pipeline = pipe("user-validation")
  .from(userInput)
  .through(validateUser)
  .through(enrichUser)
  .to(saveUser);
```

### Semantic API

```typescript
import { pipeline, ingress, transform, egress, run } from "../src/semantic";

const userPipeline = pipeline("user-validation")
  .start(ingress("input", getUserData))
  .then(transform("validate", validateUserWithZod))
  .then(transform("enrich", enrichUserData))
  .end(egress("save", saveUserToDatabase));

await run(userPipeline);
```

## Error Handling

Zod validation nodes provide detailed error information:

```typescript
try {
  await run(pipeline);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation errors:");
    error.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
}
```

## Best Practices

1. **Use specific error messages** to help with debugging
2. **Combine validation nodes** for complex validation workflows
3. **Use `safeValidateSchema`** when you want to handle errors gracefully
4. **Leverage async refinements** for database checks or external API validation
5. **Use `transformWithSchema`** for type-safe data transformations
6. **Test your schemas thoroughly** with edge cases

## Examples

See the following example files for complete usage demonstrations:

- [`examples/zod-validation.pipeline.ts`](../examples/zod-validation.pipeline.ts) - Core API example
- [`examples/semantic/zod-validation.semantic.ts`](../examples/semantic/zod-validation.semantic.ts) - Semantic API example

## TypeScript Integration

All Zod validation nodes are fully type-safe and integrate seamlessly with TypeScript:

```typescript
type User = z.infer<typeof UserSchema>;

const validateUser = validateSchema("validate", { schema: UserSchema });
// validateUser input: unknown, output: User

const enrichUser = transformWithSchema(
  "enrich",
  UserSchema,
  EnrichedUserSchema,
  (user: User) => enrichUserData(user) // Type-safe transformation
);
```