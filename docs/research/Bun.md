# Bun – Key Features for Effect Pipelines

* Single native binary written in **Zig** and powered by **JavaScriptCore**.
* Built-in **package manager** (`bun install`) – 20-30× faster than npm / yarn.
* Native **TypeScript / JSX** execution – no transpile step, instant startup.
* Ultra-fast **HTTP** & **WebSocket** server via `Bun.serve` with automatic TLS.
* Zero-dep **SQLite** driver (`bun:sqlite`) – perfect for lightweight persistence.
* Integrated **test runner**, **bundler** & **minifier** – useful for optional adapter bundles.
* `Bun.$` shell API – used by the orchestrator to spawn supervised workers.
* High fidelity **Node.js compatibility** layer (> 95 %) enabling gradual adoption of npm packages when unavoidable.
* Cross-platform: macOS, Linux and (beta) Windows. Effect Pipelines targets **Bun ≥ 1.2**.