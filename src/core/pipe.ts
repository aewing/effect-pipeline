import type { Node } from "./node";

/**
 * A Pipe represents a static, ordered list of Nodes whose schemas are
 * compatible end-to-end. It is produced by the `pipeline()` builder and is used
 * by the runtime engine and deployment manifest.
 */
export interface Pipe {
  readonly name: string;
  readonly nodes: readonly Node<any, any, any, any>[];
} 