import type { Cluster } from "./cluster";
import type { Deployment } from "./deployment";

/**
 * Fluent builder utility for constructing {@link Cluster} descriptors.
 *
 * Usage:
 * ```ts
 * const prod = cluster("prod")
 *   .addDeployment(api)
 *   .addDeployment(analytics)
 *   .withConfig({ region: "us-east-1" })
 *   .build();
 * ```
 */
export class ClusterBuilder {
  private readonly deployments: Deployment[] = [];
  private config?: Record<string, unknown>;

  constructor(private readonly name: string) {}

  /**
   * Append a {@link Deployment} to the cluster definition.
   */
  addDeployment(deployment: Deployment): this {
    this.deployments.push(deployment);
    return this;
  }

  /**
   * Provide an arbitrary configuration object that will be available at runtime
   * for orchestrator back-ends or observability layers.
   */
  withConfig(config: Record<string, unknown>): this {
    this.config = { ...(this.config ?? {}), ...config };
    return this;
  }

  /**
   * Finalise the builder and produce an immutable {@link Cluster} instance.
   */
  build(): Cluster {
    return {
      name: this.name,
      deployments: [...this.deployments],
      ...(this.config ? { config: this.config } : {})
    } satisfies Cluster;
  }
}

/**
 * Entry-point helper to create a {@link ClusterBuilder}.
 */
export function cluster(name: string): ClusterBuilder {
  if (!name || name.trim() === "") {
    throw new Error("Cluster name must be a non-empty string");
  }
  return new ClusterBuilder(name);
} 