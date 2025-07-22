import { describe, it, expect } from "bun:test";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { ConfigManager } from "./manager";

describe("ConfigManager", () => {
  it("should load JSON config", () => {
    const path = join(process.cwd(), "temp.config.json");
    writeFileSync(path, JSON.stringify({ hello: "world" }), "utf-8");
    const cfg = ConfigManager.load(path);
    expect(cfg.format).toBe("json");
    expect((cfg.data as any).hello).toBe("world");
    unlinkSync(path);
  });
}); 