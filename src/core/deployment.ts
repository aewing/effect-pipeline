import type { Pipe } from "./pipe";

export interface Deployment {
  readonly name: string;
  readonly pipe: Pipe;
  /**
   * Execution strategy – for now we only support in-process local execution.
   * Future options: "bun-worker", "docker", "kubernetes".
   */
  readonly strategy?: "local";
} 