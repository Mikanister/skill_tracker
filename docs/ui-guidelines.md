# UI Patterns & Shared Components

Guidelines for composing page layouts with shared primitives.

## Core Building Blocks

### `SectionCard`
- **Usage**: Wrap page sections requiring a title + content block.
- **Props**:
  - `title`: string or ReactNode shown in the header row.
  - `actions?`: ReactNode rendered alongside the title.
  - `children`: main content area.
- **Layout**: Uses consistent padding, corner radius, and responsive spacing.
- **Do**: Slot complex controls (filters, buttons) via `actions` to keep header alignment.
- **Avoid**: Nesting SectionCard inside another SectionCard; prefer stacks or grids.

### `PageHeader`
- **Usage**: Page-level masthead with title, subtitle, and action buttons.
- **Props**:
  - `title`: Required.
  - `description?`: Optional helper text.
  - `primaryAction?`/`secondaryAction?`: Buttons or custom nodes.
- **Do**: Keep primary CTAs in the `primaryAction`; secondary actions for filters/help.
- **Avoid**: Inline state fetching—pass data down from pages.

### `Modal` + `ModalActions`
- **Modal** handles shell layout, ESC/overlay close, optional width.
- **ModalActions** standardizes footer alignment and button styling.
- **Patterns**:
  - Place destructive actions in `start` slot (`variant: 'danger' | 'danger-soft'`).
  - Primary submit/save action goes last with `variant: 'primary' | 'success-soft'`.
  - Use `variant: 'panel'` for neutral cancel buttons.

### Buttons & Variants
- Shared CSS classes align with variants: `btn-primary`, `btn-primary-soft`, `btn-secondary`, `btn-panel`, `btn-success-soft`, `btn-danger`, `btn-danger-soft`.
- When adding a new custom button, update `ModalActions` variant map to centralize styling.

### Layout Utilities
- Use `.stack` helpers for vertical layout with spacing.
- Prefer CSS modules or inline style objects for one-off adjustments; avoid scattering new global classes.

## Adding New Components
1. Determine domain folder (`src/components/<Domain>`).
2. Expose via local `index.ts` for clean imports (`export { Foo } from './Foo';`).
3. Update relevant page README with placement rationale if component is page-specific.
4. When a component becomes shared, move under a neutral folder and document here.
