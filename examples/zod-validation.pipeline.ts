/**
 * Zod Schema Validation Pipeline Example
 * 
 * This example demonstrates how to use Zod schema validation transformer nodes
 * to validate, parse, and transform data in Effect pipelines.
 */
import { z } from "zod";
import { NodeKind, type Node } from "../src/core/node";
import { validateSchema, parseSchema, refineSchema, transformWithSchema } from "../src/nodes";
import { pipe } from "../src/pipes/builder";

// Define schemas for our data pipeline
const UserInputSchema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
  preferences: z.object({
    newsletter: z.boolean(),
    theme: z.enum(["light", "dark", "auto"])
  }),
  metadata: z.record(z.string()).optional()
});

const ProcessedUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number(),
  preferences: z.object({
    newsletter: z.boolean(),
    theme: z.enum(["light", "dark", "auto"])
  }),
  metadata: z.record(z.string()),
  createdAt: z.date(),
  isAdult: z.boolean()
});

// Mock ingress node that provides user input
const mockUserInput: Node<undefined, unknown> = {
  kind: NodeKind.Ingress,
  name: "user-input",
  run: async () => ({
    email: "user@example.com",
    age: 25,
    preferences: {
      newsletter: true,
      theme: "dark"
    },
    metadata: {
      source: "web",
      campaign: "signup"
    }
  })
};

// Validate incoming user data
const validateUserInput = validateSchema("validate-user-input", {
  schema: UserInputSchema,
  errorMessage: "Invalid user input data"
});

// Add business logic refinements
const refineUserData = refineSchema("refine-user-data", {
  schema: UserInputSchema,
  refinements: [
    {
      check: (data) => data.age >= 13,
      message: "User must be at least 13 years old"
    },
    {
      check: (data) => !data.email.includes("+"),
      message: "Email addresses with + symbols are not supported"
    }
  ]
});

// Transform validated data to processed user format
const transformToProcessedUser = transformWithSchema(
  "transform-to-processed-user",
  UserInputSchema,
  ProcessedUserSchema,
  (input) => ({
    id: crypto.randomUUID(),
    email: input.email,
    age: input.age,
    preferences: input.preferences,
    metadata: input.metadata || {},
    createdAt: new Date(),
    isAdult: input.age >= 18
  })
);

// Mock egress node that saves the processed user
const saveProcessedUser: Node<any, void> = {
  kind: NodeKind.Egress,
  name: "save-user",
  run: async (user) => {
    console.log("Saving processed user:", JSON.stringify(user, null, 2));
  }
};

// Build the pipeline
export const zodValidationPipeline = pipe("zod-validation-demo")
  .from(mockUserInput)
  .through(validateUserInput)
  .through(refineUserData)
  .through(transformToProcessedUser)
  .to(saveProcessedUser);

// Example with error handling using safeValidateSchema
const safeValidation = parseSchema("safe-user-validation", {
  inputSchema: z.unknown(),
  outputSchema: z.object({
    success: z.boolean(),
    data: UserInputSchema.optional(),
    errors: z.array(z.string()).optional()
  }),
  transform: (input) => {
    const result = UserInputSchema.safeParse(input);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { 
        success: false, 
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
  }
});

console.log("Zod validation pipeline created successfully!");
console.log("Pipeline steps:", zodValidationPipeline.nodes.map(n => n.name));