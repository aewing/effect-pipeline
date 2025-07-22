import { describe, it, expect } from "bun:test";
import { renderHeader } from "./header";

describe("renderHeader", () => {
  it("should include Effect Pipeline text", () => {
    const header = renderHeader();
    expect(header).toContain("Effect Pipeline v");
  });
}); 