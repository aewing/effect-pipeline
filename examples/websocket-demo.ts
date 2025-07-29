#!/usr/bin/env bun

import { 
  websocketServer, 
  websocketClient,
  createWebSocketServer,
  createWebSocketClient,
  type WebSocketServerConfig,
  type WebSocketClientConfig,
  type WebSocketMessage,
  type WebSocketClientMessage
} from "../src/nodes";

/**
 * WebSocket Demo
 * 
 * This example demonstrates how to use the WebSocket server and client nodes
 * with Bun's native WebSocket support. It shows:
 * 
 * 1. Creating a WebSocket server that echoes messages
 * 2. Creating a WebSocket client that connects and sends messages
 * 3. Handling both text and binary messages
 * 4. Auto-reconnection capabilities
 */

async function runWebSocketDemo() {
  console.log("🚀 Starting WebSocket Demo with Bun native WebSocket support\n");

  // 1. Create and start a WebSocket server
  console.log("📡 Creating WebSocket Server...");
  
  const serverConfig: WebSocketServerConfig = {
    port: 3001,
    hostname: "localhost",
    path: "/ws",
    perMessageDeflate: false,
    maxCompressedSize: 1024 * 1024,
    maxBackpressure: 1024 * 1024
  };

  // Start the server
  const serverContext = createWebSocketServer(serverConfig);
  console.log("✅ WebSocket server started successfully!");
  console.log("🌐 Test client available at: http://localhost:3001/\n");

  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Create a WebSocket client
  console.log("🔌 Creating WebSocket Client...");
  
  const clientConfig: WebSocketClientConfig = {
    url: "ws://localhost:3001/ws",
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
  };

  let messageCount = 0;
  const maxMessages = 5;

  try {
    // Create client with message handler
    const clientContext = await createWebSocketClient(clientConfig, (data, type) => {
      messageCount++;
      console.log(`📨 Client received ${type} message:`, 
        type === "text" ? data : `<binary data ${(data as Uint8Array).length} bytes>`
      );
    });

    console.log("✅ WebSocket client connected successfully!\n");

    // 3. Create and test the WebSocket nodes
    console.log("🧪 Testing WebSocket Nodes...\n");

    // Create server node
    const serverNode = websocketServer("demo-server", serverConfig);
    console.log(`📋 Created server node: ${serverNode.name} (${serverNode.kind})`);

    // Create client node  
    const clientNode = websocketClient("demo-client", clientConfig);
    console.log(`📋 Created client node: ${clientNode.name} (${clientNode.kind})\n`);

    // 4. Send test messages
    console.log("💬 Sending test messages...\n");

    // Send text message
    if (clientContext.ws) {
      clientContext.ws.send("Hello from WebSocket client!");
      
      // Send binary message after a delay
      setTimeout(() => {
        if (clientContext.ws) {
          const binaryMessage = new Uint8Array([72, 101, 108, 108, 111, 32, 66, 105, 110, 97, 114, 121]); // "Hello Binary"
          console.log("📤 Client sending binary message...");
          clientContext.ws.send(binaryMessage);
        }
      }, 2000);

      // Send JSON message
      setTimeout(() => {
        if (clientContext.ws) {
          const jsonMessage = JSON.stringify({
            type: "json",
            payload: {
              message: "Hello JSON",
              timestamp: new Date().toISOString(),
              sequence: 1
            }
          });
          console.log("📤 Client sending JSON message...");
          clientContext.ws.send(jsonMessage);
        }
      }, 4000);
    }

    // 5. Demonstrate node usage (simplified - in real usage you'd integrate with Effect context)
    console.log("🔧 Demonstrating Node API usage...\n");

    // Example of how you might use the nodes in a pipeline
    const demoMessage: WebSocketMessage = {
      type: "text",
      data: "Demo message for node processing",
      clientId: "demo_client",
      timestamp: Date.now()
    };

    const demoClientMessage: WebSocketClientMessage = {
      type: "text", 
      data: "Demo message from client node"
    };

    console.log("📝 Example server node input:", demoMessage);
    console.log("📝 Example client node input:", demoClientMessage);

    // Let the demo run for a while
    console.log("\n⏳ Demo running... (will auto-exit in 30 seconds)");
    console.log("💡 You can also test manually by visiting: http://localhost:3001/\n");

    // Auto-exit after 30 seconds
    setTimeout(() => {
      console.log("\n🏁 Demo completed!");
      console.log("📊 Messages exchanged:", messageCount);
      console.log("🛑 Shutting down...");
      
      // Cleanup
      if (clientContext.ws) {
        clientContext.ws.close();
      }
      
      if (serverContext.server) {
        serverContext.server.stop?.(true);
      }
      
      process.exit(0);
    }, 30000);

  } catch (error) {
    console.error("❌ Error in WebSocket demo:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log("\n\n🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log("\n\n🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Run the demo
if (import.meta.main) {
  runWebSocketDemo().catch(console.error);
}

export { runWebSocketDemo };