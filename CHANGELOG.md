# Changelog

## 0.1.0 – Initial Release

* Core abstractions: Node, Pipe, Runtime Engine.
* Cluster & Orchestrator with concurrent deployment execution.
* Fluent builders (`pipeline(...)`, `cluster(...)`).
* CLI with `run` and `orchestrator` commands (watch-mode supported).
* Event system (RuntimeEvent → EventBus) and pluggable PluginManager.
* Built-in LoggingPlugin.
* Comprehensive docs under `docs/features/**`.
* 97 unit tests; type-safe (`tsc` clean) and lint-clean. 