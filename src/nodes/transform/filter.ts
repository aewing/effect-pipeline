import { NodeKind, type Node } from "../../core/node";

export interface FilterConfig {
  readonly predicate: (input: unknown) => boolean;
}

/**
 * A Transform Node that filters data based on a predicate function.
 * Only data that passes the predicate continues to the next Node.
 */
export function filter(
  name: string,
  config: FilterConfig
): Node<unknown, unknown> {
  return {
    kind: NodeKind.Transform,
    name,
    run: async (input) => {
      if (config.predicate(input)) {
        return input;
      } else {
        // Filter out by returning null/undefined or throwing
        throw new Error(`Data filtered out by ${name}`);
      }
    }
  };
} 