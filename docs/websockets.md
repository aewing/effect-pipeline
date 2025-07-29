# WebSocket Nodes

This document describes the WebSocket server and client nodes built using Bun's native WebSocket support.

## Overview

The WebSocket nodes provide bidirectional communication capabilities for real-time applications. They are implemented as duplex nodes that can both send and receive messages.

## Available Nodes

### WebSocket Server Node

Creates a WebSocket server that can handle multiple concurrent connections.

```typescript
import { websocketServer, createWebSocketServer } from "effect-pipeline";

// Create a WebSocket server node
const serverNode = websocketServer("my-ws-server", {
  port: 3001,
  hostname: "localhost",
  path: "/ws",
  perMessageDeflate: false,
  maxCompressedSize: 1024 * 1024,
  maxBackpressure: 1024 * 1024,
  closeOnBackpressureLimit: false
});

// Start the actual server
const serverContext = createWebSocketServer({
  port: 3001,
  hostname: "localhost",
  path: "/ws"
});
```

#### Server Configuration Options

- `port?: number` - Server port (default: 3001)
- `hostname?: string` - Server hostname (default: "localhost")
- `path?: string` - WebSocket endpoint path (default: "/ws")
- `perMessageDeflate?: boolean` - Enable compression (default: false)
- `maxCompressedSize?: number` - Max compressed message size (default: 1MB)
- `maxBackpressure?: number` - Max backpressure before dropping (default: 1MB)
- `closeOnBackpressureLimit?: boolean` - Close connection on backpressure limit

#### Server Features

- **Multiple Client Support**: Handle multiple concurrent WebSocket connections
- **Built-in Test Client**: Serves an HTML test client at the root path
- **Message Echo**: Automatically echoes messages back to clients
- **Connection Management**: Tracks connected clients with unique IDs
- **Binary & Text Support**: Handles both text and binary message types

### WebSocket Client Node

Creates a WebSocket client that can connect to WebSocket servers.

```typescript
import { websocketClient, createWebSocketClient } from "effect-pipeline";

// Create a WebSocket client node
const clientNode = websocketClient("my-ws-client", {
  url: "ws://localhost:3001/ws",
  autoReconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5
});

// Create and connect the client
const clientContext = await createWebSocketClient({
  url: "ws://localhost:3001/ws",
  autoReconnect: true
}, (data, type) => {
  console.log(`Received ${type} message:`, data);
});
```

#### Client Configuration Options

- `url: string` - WebSocket server URL (required)
- `protocols?: string[]` - WebSocket subprotocols
- `headers?: Record<string, string>` - Connection headers
- `perMessageDeflate?: boolean` - Enable compression
- `maxCompressedSize?: number` - Max compressed message size
- `maxBackpressure?: number` - Max backpressure before dropping
- `closeOnBackpressureLimit?: boolean` - Close on backpressure limit
- `autoReconnect?: boolean` - Enable automatic reconnection
- `reconnectInterval?: number` - Time between reconnect attempts (ms)
- `maxReconnectAttempts?: number` - Maximum reconnection attempts

#### Client Features

- **Auto-Reconnection**: Automatically reconnect on connection loss
- **Custom Headers**: Send custom headers during connection
- **Protocol Support**: Support for WebSocket subprotocols
- **Binary & Text Support**: Send and receive both text and binary messages

## Message Types

### Server Messages

```typescript
interface WebSocketMessage {
  readonly type: "text" | "binary";
  readonly data: string | Uint8Array;
  readonly clientId: string;
  readonly timestamp: number;
}

interface WebSocketServerResponse {
  readonly type: "broadcast" | "send" | "close";
  readonly data?: string | Uint8Array;
  readonly clientId?: string;
  readonly clients?: string[];
}
```

### Client Messages

```typescript
interface WebSocketClientMessage {
  readonly type: "text" | "binary";
  readonly data: string | Uint8Array;
}

interface WebSocketClientResponse {
  readonly type: "text" | "binary";
  readonly data: string | Uint8Array;
  readonly timestamp: number;
  readonly connected: boolean;
}
```

## Examples

### Basic Echo Server

```typescript
import { websocketServer, createWebSocketServer } from "effect-pipeline";

// Create and start server
const server = createWebSocketServer({ port: 3001 });

// Create server node for pipeline integration
const serverNode = websocketServer("echo-server", { port: 3001 });
```

### Client with Auto-Reconnect

```typescript
import { createWebSocketClient } from "effect-pipeline";

const client = await createWebSocketClient({
  url: "ws://localhost:3001/ws",
  autoReconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10
}, (data, type) => {
  console.log(`Received: ${data}`);
});

// Send a message
if (client.ws) {
  client.ws.send("Hello WebSocket!");
}
```

### Binary Message Handling

```typescript
// Send binary data
const binaryData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
client.ws?.send(binaryData);

// Handle binary messages
const client = await createWebSocketClient(config, (data, type) => {
  if (type === "binary") {
    console.log(`Received ${data.length} bytes of binary data`);
  } else {
    console.log(`Received text: ${data}`);
  }
});
```

## Testing

Run the WebSocket tests:

```bash
bun test src/nodes/duplex/websocket*.test.ts
```

## Demo

Run the complete WebSocket demo:

```bash
bun run examples/websocket-demo.ts
```

The demo includes:
- WebSocket server with built-in test client
- WebSocket client with auto-reconnect
- Text, binary, and JSON message examples
- Web interface at `http://localhost:3001/`

## Integration with Effect Pipeline

The WebSocket nodes are designed to integrate seamlessly with the Effect-based pipeline system:

```typescript
import { Effect } from "effect";
import { websocketServer, type WebSocketMessage } from "effect-pipeline";

const serverNode = websocketServer("pipeline-server", { port: 3001 });

// Use in a pipeline with Effect context
const result = Effect.runSync(
  Effect.provide(
    serverNode.run(message),
    serverContext
  )
);
```

## Performance Considerations

- **Backpressure Handling**: Configure `maxBackpressure` based on your use case
- **Compression**: Enable `perMessageDeflate` for large text messages
- **Connection Limits**: Monitor concurrent connections for scalability
- **Message Size**: Set appropriate `maxCompressedSize` limits

## Security Considerations

- **Origin Validation**: Implement origin checking for production use
- **Authentication**: Add authentication headers for secure connections
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Input Validation**: Always validate incoming message data