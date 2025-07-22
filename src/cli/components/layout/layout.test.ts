import { describe, it, expect } from "bun:test";
import { renderLayout } from "./layout";

describe("renderLayout", () => {
  it("should wrap content with header and footer", () => {
    const content = "Hello World";
    const output = renderLayout(content);

    expect(output).toContain(content);
    expect(output).toContain("Effect Pipeline v");
    expect(output).toContain("Thank you for using Effect Pipeline");
  });
}); 