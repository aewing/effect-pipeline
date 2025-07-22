import { NodeKind, type Node } from "../../core/node";

export interface HttpEgressConfig {
  readonly status?: number;
  readonly headers?: Record<string, string>;
}

export interface HttpResponse {
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

/**
 * An Egress Node that sends HTTP responses. It takes the pipeline's final output
 * and formats it as a proper HTTP response with status, headers, and body.
 */
export function httpEgress(
  name: string,
  config: HttpEgressConfig
): Node<unknown, HttpResponse> {
  return {
    kind: NodeKind.Egress,
    name,
    run: async (input) => {
      return {
        status: config.status || 200,
        headers: {
          "content-type": "application/json",
          ...config.headers
        },
        body: input
      };
    }
  };
} 