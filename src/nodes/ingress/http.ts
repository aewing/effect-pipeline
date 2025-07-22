import { NodeKind, type Node } from "../../core/node";

export interface HttpIngressConfig {
  readonly path: string;
  readonly port?: number;
  readonly method?: "GET" | "POST" | "PUT" | "DELETE";
}

export interface HttpRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly query: Record<string, string>;
  readonly body?: unknown;
}

/**
 * An Ingress Node that starts a pipeline by listening for HTTP requests.
 * It extracts query parameters, headers, and body from incoming requests.
 */
export function httpIngress(
  name: string,
  config: HttpIngressConfig
): Node<undefined, HttpRequest> {
  return {
    kind: NodeKind.Ingress,
    name,
    run: async () => {
      // For now, return a mock request - we'll wire this to Bun.serve later
      return {
        method: config.method || "GET",
        url: `http://localhost:${config.port || 3000}${config.path}`,
        headers: { "content-type": "application/json" },
        query: { name: "world" },
        body: undefined
      };
    }
  };
} 