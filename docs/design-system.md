# Compact workspace design system

The interface defaults to **14px headings and 12px body text**, with compact density.
The native system UI font follows the operating system. Accent colors remain tied to the
selected light/dark profile; cards have quiet borders, 8px corners and no decorative shadow.
Tables use neutral, opaque sticky headers, subtle zebra rows and tabular numbers.

## Configuration

Open **Settings → Appearance → Typography and density**. Body size (12–20px), header
size (12–24px), code size (10–20px), and Compact/Comfortable density apply immediately.
A live card preview shows the active typography. Preferences save locally on this device,
using the existing `oryx-appearance-v1` storage key. Older saved preferences retain their
chosen UI size and color profiles; missing header/density fields acquire the new defaults.
Reset to default restores 12px body, 14px headers and compact density.

## Tokens and components

- `shared/theme/theme-settings.ts` owns defaults, validation and persistence.
- `shared/theme/interface-tokens.ts` computes font, control and spacing tokens.
- `shared/theme/interface.css` provides initial values and Tailwind mappings.
- Use `text-sm` for normal UI text and `text-heading` for headings. Small labels remain
  at body size; establish hierarchy with weight and muted color instead of tiny type.
- Use `ui-card` for a padded card and `ui-card-flush` for a table or tab container.
  Use `p-card`, `px-card` and `gap-layout` when composing shared sections.
- Buttons, inputs, selects, tabs and table cells consume semantic sizing tokens. Compact
  controls start at 30px, small controls at 28px and table cells at 6px vertical padding.
  Comfortable increases controls to 36px and card padding from 12px to 18px.
- Increasing body text expands controls to fit their line height. Font settings do not
  change the root rem size, so layout widths stay stable. Browser zoom still scales the UI.
- Application heading rules are scoped to content and overlay titles. Authored rich text
  and printed documents retain their own heading scale. Coarse pointers get 44px controls.

Changes to this system should be checked in light/dark modes, at 1366×768 and 1280×720,
with long content, keyboard focus, enlarged fonts and both density settings.

## Global foundations

`shared/theme/foundations.css` owns interface font families, the rem layout base,
spacing unit, spacing scale, fixed shell dimensions, border/focus widths, icon sizes,
and elevations. Standard Tailwind spacing classes all consume the same global scale;
Comfortable density increases this scale as well as semantic component spacing.
Arbitrary numeric interface font sizes and corner radii are replaced with token utilities.
Mathematical notation and document/print styles remain separate from interface appearance.

**Corner radius** in Appearance sets the global control radius (0–16px). Cards and shell
panels derive their radius from it. A value of zero makes all three sharp. Circular
avatars, radio controls and swatches retain their semantic circle shape.

Print and rich-text measurements are centralized in `shared/theme/document.css`; mathematical
notation uses named type tokens. These values stay independent of workspace appearance.

Validation: all 201 web test files (1,039 tests), five token/palette tests, workspace
type checking and the production web build pass. Browser inspection verified the shared
component specimen and Appearance controls in light/dark modes, at 1366×768, 1280×720
and 390px width, including 14px headers, 12px body, density changes and zero-radius surfaces.
These checks cover the design-system components; authenticated business pages require a
signed-in customer session.
