import { NodeKind, type Node, Effect } from "../../core/node";

export interface WebSocketClientConfig {
  readonly url: string;
  readonly protocols?: string[];
  readonly headers?: Record<string, string>;
  readonly perMessageDeflate?: boolean;
  readonly maxCompressedSize?: number;
  readonly maxBackpressure?: number;
  readonly closeOnBackpressureLimit?: boolean;
  readonly autoReconnect?: boolean;
  readonly reconnectInterval?: number;
  readonly maxReconnectAttempts?: number;
}

export interface WebSocketClientMessage {
  readonly type: "text" | "binary";
  readonly data: string | Uint8Array;
}

export interface WebSocketClientResponse {
  readonly type: "text" | "binary";
  readonly data: string | Uint8Array;
  readonly timestamp: number;
  readonly connected: boolean;
}

interface WebSocketClientContext {
  ws: WebSocket | null;
  connected: boolean;
  reconnectAttempts: number;
}

/**
 * A Duplex Node that creates a WebSocket client using Bun's native WebSocket support.
 * It can send messages to a WebSocket server and receive responses.
 */
export function websocketClient(
  name: string,
  config: WebSocketClientConfig
): Node<WebSocketClientMessage, WebSocketClientResponse, Error, WebSocketClientContext> {
  return {
    kind: NodeKind.Duplex,
    name,
    run: (input: WebSocketClientMessage) => 
      Effect.gen(function* (_) {
        const context = yield* _(Effect.service<WebSocketClientContext>());
        
        if (!context.connected || !context.ws) {
          throw new Error(`WebSocket client ${name} is not connected`);
        }

        try {
          // Send the message
          if (input.type === "text" && typeof input.data === "string") {
            context.ws.send(input.data);
          } else if (input.type === "binary" && input.data instanceof Uint8Array) {
            context.ws.send(input.data);
          } else {
            throw new Error(`Invalid message type or data format: ${input.type}`);
          }

          console.log(`[${name}] Sent ${input.type} message:`, 
            input.type === "text" ? input.data : `<binary data ${input.data.length} bytes>`
          );

          // Return acknowledgment (actual response would come through the message handler)
          const response: WebSocketClientResponse = {
            type: input.type,
            data: input.data,
            timestamp: Date.now(),
            connected: context.connected
          };

          return response;
        } catch (error) {
          console.error(`[${name}] Error sending message:`, error);
          throw error;
        }
      })
  };
}

/**
 * Helper function to create and connect a WebSocket client
 */
export function createWebSocketClient(
  config: WebSocketClientConfig,
  onMessage?: (data: string | Uint8Array, type: "text" | "binary") => void
): Promise<WebSocketClientContext> {
  return new Promise((resolve, reject) => {
    const context: WebSocketClientContext = {
      ws: null,
      connected: false,
      reconnectAttempts: 0
    };

    const maxReconnectAttempts = config.maxReconnectAttempts ?? 5;
    const reconnectInterval = config.reconnectInterval ?? 5000;

    function connect(): Promise<void> {
      return new Promise((connectResolve, connectReject) => {
        try {
          const wsOptions: any = {};
          
          if (config.protocols) {
            wsOptions.protocols = config.protocols;
          }
          
          if (config.headers) {
            wsOptions.headers = config.headers;
          }

          if (config.perMessageDeflate !== undefined) {
            wsOptions.perMessageDeflate = config.perMessageDeflate;
          }

          if (config.maxCompressedSize !== undefined) {
            wsOptions.maxCompressedSize = config.maxCompressedSize;
          }

          if (config.maxBackpressure !== undefined) {
            wsOptions.maxBackpressure = config.maxBackpressure;
          }

          if (config.closeOnBackpressureLimit !== undefined) {
            wsOptions.closeOnBackpressureLimit = config.closeOnBackpressureLimit;
          }

          const ws = new WebSocket(config.url, wsOptions);
          context.ws = ws;

          ws.onopen = function() {
            console.log(`WebSocket client connected to ${config.url}`);
            context.connected = true;
            context.reconnectAttempts = 0;
            connectResolve();
          };

          ws.onmessage = function(event) {
            if (onMessage) {
              const isText = typeof event.data === "string";
              onMessage(event.data, isText ? "text" : "binary");
            }
            console.log(`WebSocket client received ${typeof event.data === "string" ? "text" : "binary"} message:`, 
              typeof event.data === "string" ? event.data : `<binary data ${event.data.length} bytes>`
            );
          };

          ws.onclose = function(event) {
            console.log(`WebSocket client disconnected. Code: ${event.code}, Reason: ${event.reason}`);
            context.connected = false;
            context.ws = null;

            // Auto-reconnect if enabled and not exceeded max attempts
            if (config.autoReconnect && context.reconnectAttempts < maxReconnectAttempts) {
              context.reconnectAttempts++;
              console.log(`Attempting to reconnect (${context.reconnectAttempts}/${maxReconnectAttempts}) in ${reconnectInterval}ms...`);
              
              setTimeout(() => {
                connect().catch(error => {
                  console.error(`Reconnect attempt ${context.reconnectAttempts} failed:`, error);
                  if (context.reconnectAttempts >= maxReconnectAttempts) {
                    console.error("Max reconnect attempts reached. Giving up.");
                  }
                });
              }, reconnectInterval);
            }
          };

          ws.onerror = function(error) {
            console.error("WebSocket client error:", error);
            context.connected = false;
            connectReject(error);
          };

        } catch (error) {
          console.error("Failed to create WebSocket client:", error);
          connectReject(error);
        }
      });
    }

    // Initial connection
    connect()
      .then(() => resolve(context))
      .catch(reject);
  });
}

/**
 * Helper function to disconnect a WebSocket client
 */
export function disconnectWebSocketClient(context: WebSocketClientContext): void {
  if (context.ws) {
    context.ws.close();
    context.ws = null;
    context.connected = false;
  }
}

/**
 * Helper function to check if WebSocket client is connected
 */
export function isWebSocketClientConnected(context: WebSocketClientContext): boolean {
  return context.connected && context.ws !== null && context.ws.readyState === WebSocket.OPEN;
}