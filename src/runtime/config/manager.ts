import { readFileSync } from "fs";
import { join, extname, resolve } from "path";
import * as toml from "toml";
import * as yaml from "yaml";
import type { RuntimeConfig, ConfigFormat } from "./types";

/**
 * Simple synchronous configuration loader that supports JS/TS, JSON, YAML, and TOML.
 * The loader resolves the provided path relative to the current working directory.
 */
export class ConfigManager {
  static load(filePath: string): RuntimeConfig {
    const resolved = resolve(process.cwd(), filePath);
    const ext = extname(resolved).replace(".", "").toLowerCase() as ConfigFormat;

    switch (ext) {
      case "js":
      case "ts": {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const data = require(resolved);
        return { format: ext, filePath: resolved, data };
      }
      case "json": {
        const raw = readFileSync(resolved, "utf-8");
        const data = JSON.parse(raw);
        return { format: ext, filePath: resolved, data };
      }
      case "yaml":
      case "yml": {
        const raw = readFileSync(resolved, "utf-8");
        const data = yaml.parse(raw);
        return { format: ext, filePath: resolved, data };
      }
      case "toml": {
        const raw = readFileSync(resolved, "utf-8");
        const data = toml.parse(raw);
        return { format: ext, filePath: resolved, data };
      }
      default:
        throw new Error(`Unsupported config format: ${ext}`);
    }
  }
}
