import { NodeKind, type Node } from "../../core/node";

export interface MapJsonConfig {
  readonly transform: (input: unknown) => unknown;
}

/**
 * A Transform Node that applies a function to its input and returns the result.
 * This is the most basic transformation - it can be used to map, filter, or enrich data.
 */
export function mapJson(
  name: string,
  config: MapJsonConfig
): Node<unknown, unknown> {
  return {
    kind: NodeKind.Transform,
    name,
    run: async (input) => {
      return config.transform(input);
    }
  };
} 