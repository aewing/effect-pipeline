import { Effect } from "effect";
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
 * This is a simpler version that generates mock requests based on the config.
 */
export function httpIngress(
  name: string,
  config: HttpIngressConfig
): Node<undefined, HttpRequest> {
  return {
    kind: NodeKind.Ingress,
    name,
    run: () => Effect.gen(function* () {
      // Generate a mock request based on the configuration
      // In a real implementation, this would connect to an actual HTTP server
      const mockRequest: HttpRequest = {
        method: config.method || "GET",
        url: `http://localhost:${config.port || 3000}${config.path}`,
        headers: { 
          "content-type": "application/json",
          "user-agent": "MockClient/1.0",
          "accept": "*/*"
        },
        query: { 
          name: "world",
          timestamp: new Date().toISOString()
        },
        body: config.method === "POST" || config.method === "PUT" 
          ? { message: "Mock request body", path: config.path }
          : undefined
      };

      console.log(`HTTP Ingress "${name}" generated mock request:`, {
        method: mockRequest.method,
        url: mockRequest.url,
        hasBody: !!mockRequest.body
      });

      return mockRequest;
    })
  };
} 