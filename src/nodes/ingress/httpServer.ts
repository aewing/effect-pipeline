import { Effect } from "effect";
import { NodeKind, type Node } from "../../core/node";

export interface HttpServerConfig {
  readonly port?: number;
  readonly hostname?: string;
  readonly development?: boolean;
}

export interface HttpRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly query: Record<string, string>;
  readonly body?: unknown;
  readonly params?: Record<string, string>;
}

interface ServerContext {
  server: any; // Bun server instance
  requestQueue: Array<{
    request: Request;
    resolve: (response: Response) => void;
    reject: (error: Error) => void;
  }>;
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
  const development = config.development ?? false;

  let serverContext: ServerContext | null = null;

  return {
    kind: NodeKind.Ingress,
    name,
    run: () => Effect.gen(function* () {
      // If server is already running, get the next request from the queue
      if (serverContext && serverContext.requestQueue.length > 0) {
        const { request, resolve } = serverContext.requestQueue.shift()!;
        
        // Parse the request into our HttpRequest format
        const url = new URL(request.url);
        const headers: Record<string, string> = {};
        for (const [key, value] of request.headers.entries()) {
          headers[key] = value;
        }
        
        const query: Record<string, string> = {};
        for (const [key, value] of url.searchParams.entries()) {
          query[key] = value;
        }

        let body: unknown = undefined;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          const contentType = request.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            try {
              body = yield* Effect.tryPromise(() => request.json());
            } catch {
              body = undefined;
            }
          } else if (contentType?.includes('application/x-www-form-urlencoded')) {
            try {
              const formData = yield* Effect.tryPromise(() => request.formData());
              body = Object.fromEntries(formData.entries());
            } catch {
              body = undefined;
            }
          } else {
            try {
              body = yield* Effect.tryPromise(() => request.text());
            } catch {
              body = undefined;
            }
          }
        }

        const httpRequest: HttpRequest = {
          method: request.method,
          url: request.url,
          headers,
          query,
          body
        };

        // Store the resolve function for later use by the response handler
        (httpRequest as any)._resolve = resolve;

        return httpRequest;
      }

      // Start the server if it hasn't been started yet
      if (!serverContext) {
        serverContext = {
          server: null,
          requestQueue: []
        };

        const server = Bun.serve({
          port,
          hostname,
          development,
          fetch: (request: Request) => {
            return new Promise<Response>((resolve, reject) => {
              serverContext!.requestQueue.push({ request, resolve, reject });
            });
          },
          error: (error: Error) => {
            console.error(`HTTP Server Error in ${name}:`, error);
            return new Response("Internal Server Error", { status: 500 });
          }
        });

        serverContext.server = server;
        console.log(`HTTP Server "${name}" listening on ${server.url}`);
      }

      // Wait for the next request
      return yield* Effect.async<HttpRequest>((resume) => {
        const checkForRequest = () => {
          if (serverContext && serverContext.requestQueue.length > 0) {
            const { request, resolve } = serverContext.requestQueue.shift()!;
            
            // Parse the request
            const url = new URL(request.url);
            const headers: Record<string, string> = {};
            for (const [key, value] of request.headers.entries()) {
              headers[key] = value;
            }
            
            const query: Record<string, string> = {};
            for (const [key, value] of url.searchParams.entries()) {
              query[key] = value;
            }

            // Handle body parsing for non-GET requests
            const parseBody = async () => {
              if (request.method === 'GET' || request.method === 'HEAD') {
                return undefined;
              }
              
              const contentType = request.headers.get('content-type');
              try {
                if (contentType?.includes('application/json')) {
                  return await request.json();
                } else if (contentType?.includes('application/x-www-form-urlencoded')) {
                  const formData = await request.formData();
                  return Object.fromEntries(formData.entries());
                } else {
                  return await request.text();
                }
              } catch {
                return undefined;
              }
            };

            parseBody().then(body => {
              const httpRequest: HttpRequest = {
                method: request.method,
                url: request.url,
                headers,
                query,
                body
              };

              // Store the resolve function for later use
              (httpRequest as any)._resolve = resolve;
              
              resume(Effect.succeed(httpRequest));
            }).catch(error => {
              resume(Effect.fail(error));
            });
          } else {
            // Check again in a few milliseconds
            setTimeout(checkForRequest, 10);
          }
        };
        
        checkForRequest();
      });
    })
  };
} 