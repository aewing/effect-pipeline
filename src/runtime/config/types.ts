export type ConfigFormat = "js" | "ts" | "json" | "yaml" | "yml" | "toml";

export interface RuntimeConfig {
  readonly format: ConfigFormat;
  readonly filePath: string;
  readonly data: unknown;
}

