import { NodeKind, type Node, Effect } from "../../core/node";
import { z } from "zod";

export interface RefineSchemaConfig<T> {
  readonly schema: z.ZodSchema<T>;
  readonly refinements: Array<{
    check: (data: T) => boolean | Promise<boolean>;
    message: string;
    path?: (string | number)[];
  }>;
  readonly errorMessage?: string;
}

export interface ConditionalSchemaConfig<T, U> {
  readonly condition: (input: unknown) => boolean;
  readonly trueSchema: z.ZodSchema<T>;
  readonly falseSchema: z.ZodSchema<U>;
  readonly errorMessage?: string;
}

/**
 * A Transform Node that applies additional refinements to a Zod schema.
 * Useful for complex business logic validation that goes beyond basic type checking.
 */
export function refineSchema<T>(
  name: string,
  config: RefineSchemaConfig<T>
): Node<unknown, T> {
  return {
    kind: NodeKind.Transform,
    name,
    run: (input) => Effect.tryPromise({
      try: async () => {
        // First parse with base schema
        const parsed = config.schema.parse(input);
        
        // Apply each refinement
        for (const refinement of config.refinements) {
          const isValid = await refinement.check(parsed);
          if (!isValid) {
            const error = new z.ZodError([{
              code: z.ZodIssueCode.custom,
              message: refinement.message,
              path: refinement.path || []
            }]);
            throw error;
          }
        }
        
        return parsed;
      },
      catch: (error) => {
        const message = config.errorMessage 
          ? `${config.errorMessage}: ${error instanceof z.ZodError ? error.message : String(error)}`
          : `Schema refinement failed in ${name}: ${error instanceof z.ZodError ? error.message : String(error)}`;
        return new Error(message);
      }
    })
  };
}

/**
 * A Transform Node that applies different schemas based on a condition.
 * Useful for handling different data formats or types based on runtime conditions.
 */
export function conditionalSchema<T, U>(
  name: string,
  config: ConditionalSchemaConfig<T, U>
): Node<unknown, T | U> {
  return {
    kind: NodeKind.Transform,
    name,
    run: (input) => Effect.sync(() => {
      try {
        const useTrue = config.condition(input);
        const schema = useTrue ? config.trueSchema : config.falseSchema;
        return schema.parse(input);
      } catch (error) {
        const message = config.errorMessage 
          ? `${config.errorMessage}: ${error instanceof z.ZodError ? error.message : String(error)}`
          : `Conditional schema validation failed in ${name}: ${error instanceof z.ZodError ? error.message : String(error)}`;
        throw new Error(message);
      }
    })
  };
}

/**
 * A Transform Node that transforms data while preserving type safety with schemas.
 * Validates input, applies transformation, and validates output.
 */
export function transformWithSchema<T, U>(
  name: string,
  inputSchema: z.ZodSchema<T>,
  outputSchema: z.ZodSchema<U>,
  transform: (data: T) => U | Promise<U>
): Node<unknown, U> {
  return {
    kind: NodeKind.Transform,
    name,
    run: (input) => Effect.tryPromise({
      try: async () => {
        // Validate input
        const validInput = inputSchema.parse(input);
        
        // Apply transformation
        const transformed = await transform(validInput);
        
        // Validate output
        return outputSchema.parse(transformed);
      },
      catch: (error) => new Error(
        `Transform with schema failed in ${name}: ${error instanceof z.ZodError ? error.message : String(error)}`
      )
    })
  };
}