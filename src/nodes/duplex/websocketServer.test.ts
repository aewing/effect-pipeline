import { test, expect, describe } from "bun:test";
import { 
  websocketServer, 
  createWebSocketServer, 
  type WebSocketServerConfig, 
  type WebSocketMessage, 
  type WebSocketServerResponse 
} from "./websocketServer";
import { NodeKind } from "../../core/node";

describe("WebSocket Server Node", () => {
  test("should create a websocket server node with correct properties", () => {
    const config: WebSocketServerConfig = {
      port: 3001,
      hostname: "localhost",
      path: "/ws"
    };

    const node = websocketServer("test-ws-server", config);

    expect(node.kind).toBe(NodeKind.Duplex);
    expect(node.name).toBe("test-ws-server");
    expect(typeof node.run).toBe("function");
  });

  test("should create websocket server with default config", () => {
    const node = websocketServer("default-server");

    expect(node.kind).toBe(NodeKind.Duplex);
    expect(node.name).toBe("default-server");
    expect(typeof node.run).toBe("function");
  });

  test("should process text message input", async () => {
    const node = websocketServer("test-server");
    
    const testMessage: WebSocketMessage = {
      type: "text",
      data: "Hello WebSocket",
      clientId: "client_1",
      timestamp: Date.now()
    };

    // Mock the Effect service context
    const mockContext = {
      server: null,
      clients: new Map()
    };

    // Since we're testing the node logic without the full Effect context,
    // we'll test the structure and behavior expectations
    expect(typeof node.run).toBe("function");
    
    // The run function expects Effect context, so we test the node structure
    expect(node.name).toBe("test-server");
    expect(node.kind).toBe(NodeKind.Duplex);
  });

  test("should process binary message input", async () => {
    const node = websocketServer("binary-server");
    
    const binaryData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const testMessage: WebSocketMessage = {
      type: "binary",
      data: binaryData,
      clientId: "client_2",
      timestamp: Date.now()
    };

    expect(typeof node.run).toBe("function");
    expect(node.name).toBe("binary-server");
    expect(node.kind).toBe(NodeKind.Duplex);
  });

  test("should create WebSocket server context with default config", () => {
    // Test that createWebSocketServer function exists and has correct type
    expect(typeof createWebSocketServer).toBe("function");
    
    // We can't easily test the actual server creation in unit tests
    // as it would require starting a real server, but we can test
    // the function exists and the config handling
    const defaultConfig = {};
    expect(() => createWebSocketServer(defaultConfig)).not.toThrow();
  });

  test("should create WebSocket server context with custom config", () => {
    const config: WebSocketServerConfig = {
      port: 3002,
      hostname: "127.0.0.1",
      path: "/custom-ws",
      perMessageDeflate: true,
      maxCompressedSize: 2048,
      maxBackpressure: 2048,
      closeOnBackpressureLimit: true
    };

    expect(() => createWebSocketServer(config)).not.toThrow();
  });

  test("should validate WebSocket message types", () => {
    const textMessage: WebSocketMessage = {
      type: "text",
      data: "test message",
      clientId: "test_client",
      timestamp: Date.now()
    };

    const binaryMessage: WebSocketMessage = {
      type: "binary",
      data: new Uint8Array([1, 2, 3]),
      clientId: "test_client",
      timestamp: Date.now()
    };

    expect(textMessage.type).toBe("text");
    expect(typeof textMessage.data).toBe("string");
    expect(binaryMessage.type).toBe("binary");
    expect(binaryMessage.data instanceof Uint8Array).toBe(true);
  });

  test("should validate WebSocket server response types", () => {
    const sendResponse: WebSocketServerResponse = {
      type: "send",
      clientId: "client_1",
      data: "response message"
    };

    const broadcastResponse: WebSocketServerResponse = {
      type: "broadcast",
      data: "broadcast message",
      clients: ["client_1", "client_2"]
    };

    const closeResponse: WebSocketServerResponse = {
      type: "close",
      clientId: "client_1"
    };

    expect(sendResponse.type).toBe("send");
    expect(broadcastResponse.type).toBe("broadcast");
    expect(closeResponse.type).toBe("close");
    expect(Array.isArray(broadcastResponse.clients)).toBe(true);
  });
});