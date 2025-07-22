import { describe, it, expect } from "bun:test";
import { httpServer } from "./httpServer";
import { NodeKind } from "../../core/node";

describe("httpServer", () => {
  it("should create a valid ingress node", () => {
    const node = httpServer("test-server");

    expect(node.kind).toBe(NodeKind.Ingress);
    expect(node.name).toBe("test-server");
  });

  it("should use default port and hostname", async () => {
    const node = httpServer("test-server");
    const result = await node.run(undefined);

    expect(result.url).toContain("localhost:3000");
  });

  it("should use custom port", async () => {
    const node = httpServer("test-server", { port: 8080 });
    const result = await node.run(undefined);

    expect(result.url).toContain(":8080");
  });

  it("should use custom hostname", async () => {
    const node = httpServer("test-server", { hostname: "example.com" });
    const result = await node.run(undefined);

    expect(result.url).toContain("example.com");
  });

  it("should return expected request structure", async () => {
    const node = httpServer("test-server");
    const result = await node.run(undefined);

    expect(result).toHaveProperty("method");
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("headers");
    expect(result).toHaveProperty("query");
    expect(result).toHaveProperty("body");
    expect(result.method).toBe("GET");
    expect(result.headers["content-type"]).toBe("application/json");
  });

  it("should include query parameters", async () => {
    const node = httpServer("test-server");
    const result = await node.run(undefined);

    expect(result.query.name).toBe("world");
  });
}); 