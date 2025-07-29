import { Effect } from "effect";
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

export interface HttpRequestWithResolve {
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly query: Record<string, string>;
  readonly body?: unknown;
  readonly params?: Record<string, string>;
  readonly _resolve?: (response: Response) => void;
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
    run: (input) => Effect.gen(function* () {
      const response: HttpResponse = {
        status: config.status || 200,
        headers: {
          "content-type": "application/json",
          ...config.headers
        },
        body: input
      };

      // If this is being called in the context of an HTTP request pipeline,
      // the input might contain the original request with a resolve function
      const resolveFunction = (input as any)?._resolve || 
                             (input as any)?.request?._resolve ||
                             (input as HttpRequestWithResolve)?._resolve;

      if (resolveFunction && typeof resolveFunction === 'function') {
        // Create the actual HTTP response
        const httpResponseBody = typeof response.body === 'string' 
          ? response.body 
          : JSON.stringify(response.body);

        const httpResponseObject = new Response(httpResponseBody, {
          status: response.status,
          headers: response.headers
        });

        // Send the response back to the HTTP client
        resolveFunction(httpResponseObject);
        
        console.log(`HTTP Response sent from ${name}:`, {
          status: response.status,
          headers: response.headers,
          bodyType: typeof response.body
        });
      } else {
        // Fallback: just log the response (for testing or non-HTTP contexts)
        console.log(`HTTP Response from ${name}:`, {
          status: response.status,
          headers: response.headers,
          body: JSON.stringify(response.body, null, 2)
        });
      }

      return response;
    })
  };
} 