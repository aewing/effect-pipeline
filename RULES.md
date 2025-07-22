# Effect Pipelines – Contribution & Codebase Rules

These rules keep the codebase clean, predictable, and easy to evolve. **Every PR _must_ adhere to them.**

## 1. Single-Responsibility Files
* One feature (function, class, collection of related constants/types) **per source file**.
* Keep APIs small, pure, and semantic; favour functional style.

## 2. Mirrored Tests
* Each source file has a matching test file (`*.test.ts`) in the same path.
* Cover **every scenario & edge-case**; use Effect’s Test services, avoid flaky async sleeps.

## 3. First-Class Documentation
* Each feature owns a markdown file under `docs/features/**`.
* Describe purpose, public API, examples, and gotchas.
* Append a **Relationships** list when the feature couples with others.

## 4. Directory & Naming Conventions
* Prefer **nested directories** over long hyphenated names.
  * `nodes/ingress/http` ✅  vs.  `http-ingress-node` ❌
* Use `camelCase` / `PascalCase` for directories & files; never snake_case.
* Tests mirror the production path (`src/foo/bar.ts` → `src/foo/bar.test.ts`).

## 5. Configuration Formats
Supported, in order of precedence:
1. TypeScript / JavaScript (executed by Bun)
2. YAML
3. TOML
4. JSON

## 6. Change Workflow
1. Read existing docs, tests, and code **before** editing.
2. Update **all connected code** when introducing changes.
3. Update related feature docs – add to the *Relationships* list.
4. Run `oxlint`, `bun test`, and docs build before opening a PR.

## 7. No One-Off Scripts
If you need ad-hoc validation, **write a test case** instead.

## 8. Documentation Structure Mirrors Code
* For any source path `src/foo/bar.ts`, place its docs in `docs/features/foo/bar.md` (or `docs/features/foo/bar/README.md` for a directory overview).
* Keep the directory structure in **docs/features/** in lock-step with `src/` as the codebase grows.

---
Happy hacking 🚀 