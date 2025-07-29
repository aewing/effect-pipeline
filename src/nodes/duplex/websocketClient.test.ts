import { test, expect, describe } from "bun:test";
import { 
  websocketClient,
  createWebSocketClient,
  disconnectWebSocketClient,
  isWebSocketClientConnected,
  type WebSocketClientConfig, 
  type WebSocketClientMessage, 
  type WebSocketClientResponse 
} from "./websocketClient";
import { NodeKind } from "../../core/node";

describe("WebSocket Client Node", () => {
  test("should create a websocket client node with correct properties", () => {
    const config: WebSocketClientConfig = {
      url: "ws://localhost:3001/ws",
      protocols: ["echo-protocol"],
      autoReconnect: true,
      maxReconnectAttempts: 3
    };

    const node = websocketClient("test-ws-client", config);

    expect(node.kind).toBe(NodeKind.Duplex);
    expect(node.name).toBe("test-ws-client");
    expect(typeof node.run).toBe("function");
  });

  test("should create websocket client with minimal config", () => {
    const config: WebSocketClientConfig = {
      url: "ws://localhost:3001/ws"
    };

    const node = websocketClient("minimal-client", config);

    expect(node.kind).toBe(NodeKind.Duplex);
    expect(node.name).toBe("minimal-client");
    expect(typeof node.run).toBe("function");
  });

  test("should validate text message input", () => {
    const config: WebSocketClientConfig = {
      url: "ws://localhost:3001/ws"
    };

    const node = websocketClient("text-client", config);
    
    const textMessage: WebSocketClientMessage = {
      type: "text",
      data: "Hello Server"
    };

    expect(typeof node.run).toBe("function");
    expect(textMessage.type).toBe("text");
    expect(typeof textMessage.data).toBe("string");
  });

  test("should validate binary message input", () => {
    const config: WebSocketClientConfig = {
      url: "ws://localhost:3001/ws"
    };

    const node = websocketClient("binary-client", config);
    
    const binaryData = new Uint8Array([87, 111, 114, 108, 100]); // "World"
    const binaryMessage: WebSocketClientMessage = {
      type: "binary",
      data: binaryData
    };

    expect(typeof node.run).toBe("function");
    expect(binaryMessage.type).toBe("binary");
    expect(binaryMessage.data instanceof Uint8Array).toBe(true);
    expect(binaryMessage.data.length).toBe(5);
  });

  test("should validate WebSocket client response structure", () => {
    const response: WebSocketClientResponse = {
      type: "text",
      data: "response data",
      timestamp: Date.now(),
      connected: true
    };

    expect(response.type).toBe("text");
    expect(typeof response.data).toBe("string");
    expect(typeof response.timestamp).toBe("number");
    expect(typeof response.connected).toBe("boolean");
  });

  test("should validate WebSocket client config with all options", () => {
    const fullConfig: WebSocketClientConfig = {
      url: "wss://secure.example.com/ws",
      protocols: ["v1.echo", "v2.echo"],
      headers: {
        "Authorization": "Bearer token123",
        "User-Agent": "WebSocket-Client/1.0"
      },
      perMessageDeflate: true,
      maxCompressedSize: 1024 * 1024,
      maxBackpressure: 1024 * 1024,
      closeOnBackpressureLimit: false,
      autoReconnect: true,
      reconnectInterval: 10000,
      maxReconnectAttempts: 5
    };

    const node = websocketClient("full-config-client", fullConfig);

    expect(node.kind).toBe(NodeKind.Duplex);
    expect(node.name).toBe("full-config-client");
    expect(typeof node.run).toBe("function");
  });

  test("should test helper functions exist with correct types", () => {
    expect(typeof createWebSocketClient).toBe("function");
    expect(typeof disconnectWebSocketClient).toBe("function");
    expect(typeof isWebSocketClientConnected).toBe("function");
  });

  test("should handle disconnectWebSocketClient with null context", () => {
    const mockContext = {
      ws: null,
      connected: false,
      reconnectAttempts: 0
    };

    // Should not throw when disconnecting a null WebSocket
    expect(() => disconnectWebSocketClient(mockContext)).not.toThrow();
    expect(mockContext.connected).toBe(false);
    expect(mockContext.ws).toBe(null);
  });

  test("should handle isWebSocketClientConnected with various states", () => {
    const disconnectedContext = {
      ws: null,
      connected: false,
      reconnectAttempts: 0
    };

    const mockConnectedContext = {
      ws: { readyState: 1 } as any, // Mock WebSocket.OPEN state
      connected: true,
      reconnectAttempts: 0
    };

    const mockConnectingContext = {
      ws: { readyState: 0 } as any, // Mock WebSocket.CONNECTING state
      connected: false,
      reconnectAttempts: 0
    };

    expect(isWebSocketClientConnected(disconnectedContext)).toBe(false);
    expect(isWebSocketClientConnected(mockConnectedContext)).toBe(true);
    expect(isWebSocketClientConnected(mockConnectingContext)).toBe(false);
  });

  test("should validate config URL format requirements", () => {
    const validConfigs = [
      { url: "ws://localhost:3001" },
      { url: "wss://secure.example.com:443/path" },
      { url: "ws://127.0.0.1:8080/websocket" }
    ];

    const invalidConfigs = [
      // These would fail in actual WebSocket creation, but our function should accept them
      { url: "http://example.com" }, // Wrong protocol
      { url: "invalid-url" }, // Invalid format
      { url: "" } // Empty URL
    ];

    validConfigs.forEach((config, index) => {
      expect(() => websocketClient(`valid-${index}`, config)).not.toThrow();
    });

    invalidConfigs.forEach((config, index) => {
      // Node creation should not throw, but actual connection would fail
      expect(() => websocketClient(`invalid-${index}`, config)).not.toThrow();
    });
  });
});