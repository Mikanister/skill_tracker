# Testing & Preview Templates

Guidance for writing predictable tests and lightweight previews.

## Component Tests
- **Location**: Place tests alongside feature area (e.g., `src/components/TaskBoard/taskBoard.test.tsx`) or in existing page test files when the component is page-specific.
- **Naming**: Use `<Component>.test.tsx` for React components and `<module>.test.ts` for utilities.
- **Structure**:
  1. Arrange: render component with minimal required props/helpers.
  2. Act: fire events using `@testing-library/user-event` or `fireEvent`.
  3. Assert: prefer role-based queries (`getByRole`, `findByText`).
- **Fixtures**: Use inline helper factories (e.g., `buildTask()`) in the test file. Extract to `__fixtures__/` if reused across suites.
- **Accessibility**: Assert critical ARIA attributes or keyboard flows for modals and form controls.

## Hooks
- Test hooks via `@testing-library/react` `renderHook`. Focus on public API (returns, state transitions), not implementation details.
- Mock storage/undo dependencies with simple stubs to keep tests deterministic.

## Previews / Stories
- When Storybook is unavailable, add lightweight previews:
  - Create `<Component>.preview.tsx` exporting a simple React element for manual verification.
  - Co-locate under component folder.
  - Use mocked props aligned with factories from tests.
- Document preview entry points in README or component doc to help future contributors discover them.

## Data Builders
- Keep reusable builders under `src/test-utils/` (create if needed) with clear naming (`makeTask`, `makeFighter`).
- Builders should produce sensible defaults and accept partial overrides.

## Continuous Integration Tips
- Ensure each new modal/stateful component has at least smoke coverage.
- Run `npm test -- --run` locally before pushing; watch mode is available via `npm test`.
- Avoid relying on snapshot-heavy tests—prefer explicit expectations.
