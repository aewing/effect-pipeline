import { readFileSync } from "fs";
import { join } from "path";

// Reads version from package.json at runtime to stay in sync
export function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, "../../../package.json"), "utf-8")
    );
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}
