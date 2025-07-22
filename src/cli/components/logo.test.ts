import { describe, it, expect } from "bun:test";
import { renderLogo } from "./logo";

describe("renderLogo", () => {
  it("should return a non-empty string", () => {
    const logo = renderLogo();
    expect(typeof logo).toBe("string");
    expect(logo.length).toBeGreaterThan(0);
  });
}); 