import { describe, it, expect } from "bun:test";
import { httpIngress } from "./http";
import { NodeKind } from "../../core/node";

describe("httpIngress", () => {
  it("should create a valid ingress node", () => {
    const node = httpIngress("test-ingress", { path: "/api/test" });

    expect(node.kind).toBe(NodeKind.Ingress);
    expect(node.name).toBe("test-ingress");
  });

  it("should use default port when not specified", async () => {
    const node = httpIngress("test-ingress", { path: "/api/test" });
    const result = await node.run(undefined);

    expect(result.url).toContain(":3000");
  });

  it("should use custom port when specified", async () => {
    const node = httpIngress("test-ingress", { path: "/api/test", port: 8080 });
    const result = await node.run(undefined);

    expect(result.url).toContain(":8080");
  });

  it("should use default method when not specified", async () => {
    const node = httpIngress("test-ingress", { path: "/api/test" });
    const result = await node.run(undefined);

    expect(result.method).toBe("GET");
  });

  it("should use custom method when specified", async () => {
    const node = httpIngress("test-ingress", { path: "/api/test", method: "POST" });
    const result = await node.run(undefined);

    expect(result.method).toBe("POST");
  });

  it("should return expected request structure", async () => {
    const node = httpIngress("test-ingress", { path: "/api/test" });
    const result = await node.run(undefined);

    expect(result).toHaveProperty("method");
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("headers");
    expect(result).toHaveProperty("query");
    expect(result.headers["content-type"]).toBe("application/json");
    expect(result.query.name).toBe("world");
  });
}); 