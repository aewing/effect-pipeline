import { NodeKind, type Node, Effect } from "../../core/node";
import { z } from "zod";

export interface ValidateSchemaConfig<T> {
  readonly schema: z.ZodSchema<T>;
  readonly errorMessage?: string;
}

/**
 * A Transform Node that validates input data against a Zod schema.
 * Throws an error if validation fails, otherwise passes through the validated data.
 */
export function validateSchema<T>(
  name: string,
  config: ValidateSchemaConfig<T>
): Node<unknown, T> {
  return {
    kind: NodeKind.Transform,
    name,
    run: (input) => Effect.sync(() => {
      try {
        return config.schema.parse(input);
      } catch (error) {
        const message = config.errorMessage 
          ? `${config.errorMessage}: ${error instanceof z.ZodError ? error.message : String(error)}`
          : `Schema validation failed in ${name}: ${error instanceof z.ZodError ? error.message : String(error)}`;
        throw new Error(message);
      }
    })
  };
}

/**
 * A Transform Node that safely validates input data against a Zod schema.
 * Returns validation result with success/error information instead of throwing.
 */
export function safeValidateSchema<T>(
  name: string,
  config: ValidateSchemaConfig<T>
): Node<unknown, { success: true; data: T } | { success: false; error: z.ZodError }> {
  return {
    kind: NodeKind.Transform,
    name,
    run: (input) => Effect.sync(() => {
      const result = config.schema.safeParse(input);
      if (result.success) {
        return { success: true as const, data: result.data };
      } else {
        return { success: false as const, error: result.error };
      }
    })
  };
}