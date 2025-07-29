import { Effect } from "effect";
import { NodeKind, type Node } from "../../core/node";

export interface EchoConfig {
  readonly prefix?: string;
}

/**
 * A Duplex Node that echoes its input back as output. Useful for testing
 * and as a placeholder in development pipelines.
 */
export function echo(
  name: string,
  config: EchoConfig = {}
): Node<unknown, unknown> {
  return {
    kind: NodeKind.Duplex,
    name,
    run: (input) => Effect.gen(function* () {
      const prefix = config.prefix || "";
      console.log(`${prefix}Echo:`, input);
      return input;
    })
  };
} 