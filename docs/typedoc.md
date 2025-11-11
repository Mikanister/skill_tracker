# API Documentation (TypeDoc)

Generate static API docs from source using TypeDoc.

## Prerequisites
- Dependencies installed: `npm install`
- TypeDoc configured via `typedoc.json` (already included).

## Commands
- **Generate docs**: `npm run docs:api`
  - Output directory: `docs/api/`
  - Cleans/overwrites existing contents each run.

## Scope
- Includes all modules under `src/` except tests, fixtures, and bootstrapping files (`main.tsx`, `vite-env.d.ts`).
- Private, protected, and `@internal` members are excluded to keep the surface focused on public APIs.

## Tips
- Ensure JSDoc comments are up to date; TypeDoc pulls descriptions directly from them.
- Commit meaningful updates in `docs/api/` only when distributing generated documentation (optional).
