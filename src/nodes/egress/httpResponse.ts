import { NodeKind, type Node } from "../../core/node";

export interface HttpResponseConfig {
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
export function httpResponse(
  name: string,
  config: HttpResponseConfig = {}
): Node<unknown, HttpResponse> {
  return {
    kind: NodeKind.Egress,
    name,
    run: async (input) => {
      const response: HttpResponse = {
        status: config.status || 200,
        headers: {
          "content-type": "application/json",
          ...config.headers
        },
        body: input
      };

      // For now, just log the response
      // TODO: Integrate with Bun.serve response handling
      console.log("HTTP Response:", {
        status: response.status,
        headers: response.headers,
        body: JSON.stringify(response.body, null, 2)
      });

      return response;
    }
  };
} 