import { NodeKind, type Node, Effect } from "../../core/node";

export interface WebSocketServerConfig {
  readonly port?: number;
  readonly hostname?: string;
  readonly path?: string;
  readonly perMessageDeflate?: boolean;
  readonly maxCompressedSize?: number;
  readonly maxBackpressure?: number;
  readonly closeOnBackpressureLimit?: boolean;
}

export interface WebSocketMessage {
  readonly type: "text" | "binary";
  readonly data: string | Uint8Array;
  readonly clientId: string;
  readonly timestamp: number;
}

export interface WebSocketServerResponse {
  readonly type: "broadcast" | "send" | "close";
  readonly data?: string | Uint8Array;
  readonly clientId?: string;
  readonly clients?: string[];
}

interface WebSocketServerContext {
  server: any;
  clients: Map<string, any>;
}

/**
 * A Duplex Node that creates a WebSocket server using Bun's native WebSocket support.
 * It can receive messages from connected clients and send responses back.
 */
export function websocketServer(
  name: string,
  config: WebSocketServerConfig = {}
): Node<WebSocketMessage, WebSocketServerResponse, Error, WebSocketServerContext> {
  const port = config.port || 3001;
  const hostname = config.hostname || "localhost";
  const path = config.path || "/ws";

  return {
    kind: NodeKind.Duplex,
    name,
    run: (input: WebSocketMessage) => 
      Effect.gen(function* (_) {
        const context = yield* _(Effect.service<WebSocketServerContext>());
        
        // Process incoming WebSocket message
        console.log(`[${name}] Received message from client ${input.clientId}:`, {
          type: input.type,
          data: input.type === "text" ? input.data : `<binary data ${input.data.length} bytes>`,
          timestamp: input.timestamp
        });

        // Echo the message back to the sender by default
        // This can be customized based on the input data
        const response: WebSocketServerResponse = {
          type: "send",
          clientId: input.clientId,
          data: input.type === "text" 
            ? `Echo: ${input.data}` 
            : input.data
        };

        return response;
      })
  };
}

/**
 * Helper function to create and start a WebSocket server
 */
export function createWebSocketServer(config: WebSocketServerConfig = {}): WebSocketServerContext {
  const port = config.port || 3001;
  const hostname = config.hostname || "localhost";
  const path = config.path || "/ws";
  
  const clients = new Map<string, any>();
  let clientIdCounter = 0;

  const server = Bun.serve({
    port,
    hostname,
    websocket: {
      perMessageDeflate: config.perMessageDeflate ?? false,
      maxCompressedSize: config.maxCompressedSize ?? 1024 * 1024,
      maxBackpressure: config.maxBackpressure ?? 1024 * 1024,
      closeOnBackpressureLimit: config.closeOnBackpressureLimit ?? false,

      message(ws, message) {
        const clientId = (ws as any).clientId;
        console.log(`WebSocket message from client ${clientId}:`, message);
        
        // Here you would integrate with your pipeline
        // For now, just echo back
        if (typeof message === "string") {
          ws.send(`Echo: ${message}`);
        } else {
          ws.send(message);
        }
      },

      open(ws) {
        const clientId = `client_${++clientIdCounter}`;
        (ws as any).clientId = clientId;
        clients.set(clientId, ws);
        console.log(`WebSocket client ${clientId} connected. Total clients: ${clients.size}`);
        ws.send(`Welcome! Your client ID is: ${clientId}`);
      },

      close(ws, code, message) {
        const clientId = (ws as any).clientId;
        clients.delete(clientId);
        console.log(`WebSocket client ${clientId} disconnected. Code: ${code}, Message: ${message}. Total clients: ${clients.size}`);
      },

      drain(ws) {
        console.log(`WebSocket backpressure relieved for client ${(ws as any).clientId}`);
      }
    },

    fetch(req, server) {
      const url = new URL(req.url);
      
      if (url.pathname === path) {
        if (server.upgrade(req)) {
          return; // Successfully upgraded to WebSocket
        }
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      // Handle regular HTTP requests
      if (url.pathname === "/") {
        return new Response(`
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .connected { background-color: #d4edda; color: #155724; }
        .disconnected { background-color: #f8d7da; color: #721c24; }
        textarea { width: 100%; height: 100px; margin: 10px 0; }
        button { padding: 10px 20px; margin: 5px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background-color: #0056b3; }
        .messages { border: 1px solid #ccc; padding: 10px; height: 300px; overflow-y: auto; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>WebSocket Test Client</h1>
        <div id="status" class="status disconnected">Disconnected</div>
        
        <div>
            <button onclick="connect()">Connect</button>
            <button onclick="disconnect()">Disconnect</button>
        </div>
        
        <div>
            <textarea id="messageInput" placeholder="Enter message to send..."></textarea>
            <button onclick="sendMessage()">Send Message</button>
            <button onclick="sendBinary()">Send Binary</button>
        </div>
        
        <div id="messages" class="messages"></div>
    </div>

    <script>
        let ws = null;

        function connect() {
            if (ws) {
                ws.close();
            }
            
            ws = new WebSocket('ws://${hostname}:${port}${path}');
            
            ws.onopen = function() {
                document.getElementById('status').textContent = 'Connected';
                document.getElementById('status').className = 'status connected';
                addMessage('Connected to WebSocket server');
            };
            
            ws.onmessage = function(event) {
                addMessage('Received: ' + event.data);
            };
            
            ws.onclose = function() {
                document.getElementById('status').textContent = 'Disconnected';
                document.getElementById('status').className = 'status disconnected';
                addMessage('Disconnected from WebSocket server');
            };
            
            ws.onerror = function(error) {
                addMessage('Error: ' + error);
            };
        }

        function disconnect() {
            if (ws) {
                ws.close();
                ws = null;
            }
        }

        function sendMessage() {
            const input = document.getElementById('messageInput');
            if (ws && ws.readyState === WebSocket.OPEN && input.value) {
                ws.send(input.value);
                addMessage('Sent: ' + input.value);
                input.value = '';
            }
        }

        function sendBinary() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                const binaryData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
                ws.send(binaryData);
                addMessage('Sent binary data: [72, 101, 108, 108, 111]');
            }
        }

        function addMessage(message) {
            const messages = document.getElementById('messages');
            const timestamp = new Date().toLocaleTimeString();
            messages.innerHTML += '<div>[' + timestamp + '] ' + message + '</div>';
            messages.scrollTop = messages.scrollHeight;
        }

        // Auto-connect on page load
        connect();
    </script>
</body>
</html>
        `, {
          headers: { "Content-Type": "text/html" }
        });
      }

      return new Response("Not Found", { status: 404 });
    }
  });

  console.log(`WebSocket server listening on ws://${hostname}:${port}${path}`);
  console.log(`Test client available at http://${hostname}:${port}/`);

  return { server, clients };
}