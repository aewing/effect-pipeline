import { Effect } from "effect";
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
 * This is a simpler version that just formats the response without sending it.
 */
export function httpEgress(
  name: string,
  config: HttpEgressConfig = {}
): Node<unknown, HttpResponse> {
  return {
    kind: NodeKind.Egress,
    name,
    run: (input) => Effect.gen(function* () {
      const response: HttpResponse = {
        status: config.status || 200,
        headers: {
          "content-type": "application/json",
          ...config.headers
        },
        body: input
      };

      console.log(`HTTP Egress "${name}" formatted response:`, {
        status: response.status,
        headers: response.headers,
        bodyType: typeof response.body
      });

      return response;
    })
  };
} 