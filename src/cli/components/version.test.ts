import { describe, it, expect } from "bun:test";
import { getVersion } from "./version";

describe("getVersion", () => {
  it("should return a non-empty string", () => {
    const version = getVersion();
    expect(typeof version).toBe("string");
    expect(version.length).toBeGreaterThan(0);
  });
}); 