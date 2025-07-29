import { NodeKind, type Node, Effect } from "../../core/node";
import { z } from "zod";

export interface ParseSchemaConfig<T, U> {
  readonly inputSchema: z.ZodSchema<T>;
  readonly outputSchema: z.ZodSchema<U>;
  readonly transform?: (data: T) => U | Promise<U>;
  readonly preprocessor?: (input: unknown) => unknown;
}

/**
 * A Transform Node that parses input with one schema, optionally transforms it,
 * and validates the output with another schema. Useful for data conversion pipelines.
 */
export function parseSchema<T, U>(
  name: string,
  config: ParseSchemaConfig<T, U>
): Node<unknown, U> {
  return {
    kind: NodeKind.Transform,
    name,
    run: (input) => Effect.tryPromise({
      try: async () => {
        // Preprocess input if preprocessor is provided
        const preprocessed = config.preprocessor ? config.preprocessor(input) : input;
        
        // Parse input with input schema
        const parsed = config.inputSchema.parse(preprocessed);
        
        // Transform data if transformer is provided
        const transformed = config.transform ? await config.transform(parsed) : (parsed as unknown as U);
        
        // Validate output with output schema
        return config.outputSchema.parse(transformed);
      },
      catch: (error) => new Error(
        `Parse schema failed in ${name}: ${error instanceof z.ZodError ? error.message : String(error)}`
      )
    })
  };
}

/**
 * A simpler Transform Node that just parses input data with a single schema.
 * Equivalent to validateSchema but with a more semantic name for parsing use cases.
 */
export function parseWithSchema<T>(
  name: string,
  schema: z.ZodSchema<T>,
  options?: {
    errorMessage?: string;
    preprocessor?: (input: unknown) => unknown;
  }
): Node<unknown, T> {
  return {
    kind: NodeKind.Transform,
    name,
    run: (input) => Effect.sync(() => {
      try {
        const preprocessed = options?.preprocessor ? options.preprocessor(input) : input;
        return schema.parse(preprocessed);
      } catch (error) {
        const message = options?.errorMessage 
          ? `${options.errorMessage}: ${error instanceof z.ZodError ? error.message : String(error)}`
          : `Parse failed in ${name}: ${error instanceof z.ZodError ? error.message : String(error)}`;
        throw new Error(message);
      }
    })
  };
}