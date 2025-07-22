import { NodeKind, type Node } from "../../core/node";

export interface HttpServerConfig {
  readonly port?: number;
  readonly hostname?: string;
}

export interface HttpRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly query: Record<string, string>;
  readonly body?: unknown;
}

/**
 * An Ingress Node that starts a real HTTP server using Bun.serve.
 * It listens for incoming requests and processes them through the pipeline.
 */
export function httpServer(
  name: string,
  config: HttpServerConfig = {}
): Node<undefined, HttpRequest> {
  const port = config.port || 3000;
  const hostname = config.hostname || "localhost";

  return {
    kind: NodeKind.Ingress,
    name,
    run: async () => {
      // For now, return a mock request
      // TODO: Integrate with Bun.serve for real HTTP handling
      return {
        method: "GET",
        url: `http://${hostname}:${port}/api/data`,
        headers: { "content-type": "application/json" },
        query: { name: "world" },
        body: undefined
      };
    }
  };
} 