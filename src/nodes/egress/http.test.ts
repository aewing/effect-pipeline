import { describe, it, expect } from "bun:test";
import { httpEgress } from "./http";
import { NodeKind } from "../../core/node";

describe("httpEgress", () => {
  it("should create a valid egress node", () => {
    const node = httpEgress("test-egress", { status: 200 });

    expect(node.kind).toBe(NodeKind.Egress);
    expect(node.name).toBe("test-egress");
  });

  it("should use default status when not specified", async () => {
    const node = httpEgress("test-egress", {});
    const result = await node.run({ message: "test" });

    expect(result.status).toBe(200);
  });

  it("should use custom status when specified", async () => {
    const node = httpEgress("test-egress", { status: 201 });
    const result = await node.run({ message: "test" });

    expect(result.status).toBe(201);
  });

  it("should include default headers", async () => {
    const node = httpEgress("test-egress", {});
    const result = await node.run({ message: "test" });

    expect(result.headers["content-type"]).toBe("application/json");
  });

  it("should merge custom headers with defaults", async () => {
    const node = httpEgress("test-egress", {
      headers: { "x-custom": "value", "authorization": "Bearer token" }
    });
    const result = await node.run({ message: "test" });

    expect(result.headers["content-type"]).toBe("application/json");
    expect(result.headers["x-custom"]).toBe("value");
    expect(result.headers["authorization"]).toBe("Bearer token");
  });

  it("should return input as body", async () => {
    const input = { message: "Hello World", data: [1, 2, 3] };
    const node = httpEgress("test-egress", {});
    const result = await node.run(input);

    expect(result.body).toEqual(input);
  });

  it("should handle complex input objects", async () => {
    const input = {
      user: { id: 1, name: "John" },
      metadata: { timestamp: "2023-01-01", version: "1.0" }
    };
    const node = httpEgress("test-egress", {});
    const result = await node.run(input);

    expect(result.body).toEqual(input);
  });
}); 