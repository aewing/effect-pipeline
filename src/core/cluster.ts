import type { Deployment } from "./deployment";

export interface Cluster {
  readonly name: string;
  readonly deployments: readonly Deployment[];
  /**
   * A free-form configuration object – when targeting different back-ends we
   * can extend this type or narrow it via generics.
   */
  readonly config?: Record<string, unknown>;
} 