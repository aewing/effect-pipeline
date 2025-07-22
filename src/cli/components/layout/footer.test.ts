import { describe, it, expect } from "bun:test";
import { renderFooter } from "./footer";

describe("renderFooter", () => {
  it("should include thank you text", () => {
    const footer = renderFooter();
    expect(footer).toContain("Thank you for using Effect Pipeline");
  });
}); 