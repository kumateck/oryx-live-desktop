# Form architecture

`FormWizard` is a typed field composer, matching the job of the Oryx Next component with that name. It does not own the form element, submission, API mutation, or business workflow. A module owns its Zod schema, default values, submit adapter, permissions, and save/error states.

## Use in a module

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";

const schema = z.object({ name: z.string().min(1), active: z.boolean() });
type Values = z.infer<typeof schema>;

const fields = [
  { type: InputTypes.TEXT, name: "name", label: "Name", required: true },
  { type: InputTypes.CHECKBOX, name: "active", label: "Active" },
] as const satisfies readonly WizardField<Values>[];

export function ExampleForm() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", active: false },
  });
  return <form noValidate onSubmit={form.handleSubmit((values) => { /* module mutation */ })}>
    <FormWizard form={form} fields={fields} />
    <button type="submit">Save</button>
  </form>;
}
```

Keep the field array stable outside the render function or memoize it when it depends on props. Field names are checked against the form value type; built-in text, number, and checkbox fields accept paths with matching value types. Zod owns validation. The visual `required` marker is not a replacement for a Zod rule. Use `noValidate` on the enclosing form so native validation does not suppress module error messages.

## Loading and extension

The core imports no field UI eagerly. Text, textarea, sync single select, async single select, multi-select, and checkbox renderers are separate `React.lazy` modules. A form loads only the renderer types in its `fields` array. Native fields use React Hook Form registration; controlled shadcn fields use `useController`. Each field subscribes to its own error state, so changing one field need not subscribe the whole form to every error.

## Calendar fields

Use `type: InputTypes.DATE` for a full calendar date (`Date | null`), `type: InputTypes.RANGE` for a `DateRange | null` with `from` and optional `to`, and `type: InputTypes.MONTH` for a month and year (`YYYY-MM` string or `null`). These are separate lazy renderers. Full dates and ranges compose shadcn Calendar and Popover; the month field uses shadcn Select and Popover and never asks for a day. For manufacturing and expiry months, use Zod to require valid `YYYY-MM` values and enforce expiry after manufacturing. The owning module converts full `Date` values to the backend's date format at its API boundary; FormWizard does not serialize dates or add a timezone offset.

Calendar fields accept `minDate`, `maxDate`, `fromYear`, and `toYear`. Their navigation defaults to 1900 through 30 years beyond the current year so future expiry dates remain reachable; modules can override that window. A date range stays open for its second endpoint, offers an explicit one-day choice, and provides **New range** when replacing both endpoints. Month fields accept inclusive `minMonth`, `maxMonth`, `fromYear`, and `toYear`; year and month choices outside those limits are disabled. Configure real business limits in the module schema as well as the picker.

```tsx
const batchFields = [
  { type: InputTypes.MONTH, name: "manufacturingMonth", label: "Manufacturing month" },
  { type: InputTypes.MONTH, name: "expiryMonth", label: "Expiry month" },
] as const satisfies readonly WizardField<BatchValues>[];
```

## Select fields

Selects declare `mode: "single" | "multiple"` and `source: "sync" | "async"`. A single value is a full `{ value, label }` option or `null`; a multi value is an array of full options. Keep that shape in the Zod schema and default values. Sync fields provide `options`. Async fields provide `loadOptions(search, page, signal)`, returning `{ options, hasNext, hasPrevious }`; honor the abort signal and use page numbers starting at 1. The shared loader debounces search, cancels obsolete requests, and exposes retry after failure. The async single renderer loads the shadcn Combobox; the multi renderer loads shadcn Input Group, Popover, Checkbox, Badge, and Spinner. The multi-select keeps as many selected labels as fit its measured width and summarizes the rest as `+N`. Selection and deselection preserve option objects, and select/unselect page affects enabled options on the current page only.

```tsx
const roleFields = [
  { type: InputTypes.SELECT, mode: "single", source: "sync", name: "role", label: "Role", options: roles },
  { type: InputTypes.SELECT, mode: "multiple", source: "async", name: "teams", label: "Teams", loadOptions: loadTeams },
] as const satisfies readonly WizardField<Values>[];
```

## Basic controls and time

The basic controls use shadcn Radio Group, Switch, and Slider. `radio` stores a string option value or `null`; `switch` stores a boolean; `slider` stores one number between its declared `min` and `max`. Put actual business limits in the owning Zod schema too. `time` and `clock` use the native time input and store Oryx's `HH:mm AM/PM` string; `time` may include a day prefix such as `2d 11:45 PM` when `showDays` is enabled. `moment` stores a duration such as `2 hours 15 minutes` or the legacy `Varies` value. All three have separate lazy renderer code from the initial form bundle. Module adapters must verify the backend's expected time representation for each workflow.

## Media and layout

`upload` supports a single `File | null` or multiple `File[]`, selected through a native file input or drag and drop. Set `accept` and `maxSizeBytes` to match the module's policy. The composer rejects disallowed files and lists removable local files. Previously saved files are displayed via `persisted`; changing that list calls `onPersistedChange`, so a module can implement deletion with its own permissions and API mutation. It does **not** delete a server attachment on its own. The module owns actual upload requests, errors, retry, and multipart conversion. The old `FileList`/attachment shape must be adapted at the module boundary.

`image` stores `File | null`, accepts PNG/JPEG/WebP, limits files to 5 MB by default, and previews a local object URL that is revoked when the file changes. `existingUrl` displays a saved image and `onRemoveExisting` lets the module explicitly handle server-side removal. `signature` stores a PNG data URL or `null` and uses a lazily loaded canvas; it has an explicit clear action. The module must validate permissions and persistence for signatures. These controls keep file data out of the form's initial JavaScript bundle until requested.

`label`, `space`, and `submit` are layout fields identified by a stable `id` rather than a form value name. The submit field uses shadcn Button and Spinner and only submits the enclosing form; the module continues to own `handleSubmit`, loading state, and mutations. Prefer CSS grid gap for ordinary spacing; use `space` only to preserve a meaningful legacy layout separation.

`richtext` stores an HTML string and is a separate lazy renderer backed by Tiptap. Its empty value is `""`. It supports headings, inline styles, lists, links, alignment, tables, and an expanded editing dialog. Legacy Oryx mention and hashtag markup is parsed into typed reference nodes; modules can supply explicit `references` for insertion. The module owns its Zod rule, including whether visually empty HTML is allowed, and must sanitize HTML at the server/display boundary. See [Rich text editor](./rich-text.md).

Domain-owned editable tables, formulas, and other specialized fields use `type: InputTypes.CUSTOM` with a stable `load: () => import("./fields/my-renderer")` callback. The default export receives typed `name` and `control`, plus `id`, `disabled`, `required`, `invalid`, and `describedBy` for accessible control wiring. Put the callback in the module's field configuration, not in a global registry. A custom renderer should import only its own heavy dependencies. Never copy the eager Oryx Next renderer registry or use loose casts to fit incompatible field values.

Use shadcn source components for controls and Tailwind utility classes for field layout. Theme colors and font settings flow through shared CSS variables. Shell CSS must not apply element-wide styles that alter forms in unrelated modules. Prefer one column by default; a detail section can supply responsive grid classes after checking 1366×768 and 1280×720 at display scaling.

The interaction tests in `apps/web/src/shared/forms` and `apps/web/src/shared/date-pickers` cover Zod errors, numeric conversion, basic controls, time values, file selection and image/signature behavior, sync and async selection, paging, search reset, date and range selection, month/year values, overflow calculations, and submission. Before migrating a business form, add tests for its schema, conditional fields, permissions, save failure, and any approval or audit effects.

## Password fields

A field of `type: InputTypes.PASSWORD` renders `PasswordInput` (`shared/forms/password-input.tsx`): the password is hidden by default, with a button to show or hide it. It is hidden again when the form is submitted or the field is disabled, a notice appears while Caps Lock is on, and spell-check and auto-capitalisation are off so a revealed password is not sent to those services. Use `PasswordInput` directly outside a `FormWizard`. Set `autoComplete` to `"new-password"` on forms that set a password; it defaults to `"current-password"`.

## Field types

Declare a field's type with the `InputTypes` constant from `shared/forms/input-types.ts` (`type: InputTypes.TEXT`), never a bare string; a test fails the build otherwise. The names match Oryx Next's `InputTypes`, so forms carry over with the same vocabulary.

| Oryx Next | Desktop |
| --- | --- |
| `TEXT`, `EMAIL`, `PASSWORD`, `NUMBER`, `TEXTAREA`, `DATE`, `RANGE`, `MONTH`, `TIME`, `CLOCK`, `MOMENT`, `CHECKBOX`, `RADIO`, `SWITCH`, `SLIDER`, `UPLOAD`, `IMAGE`, `SIGNATURE`, `RICHTEXT`, `LABEL`, `SPACE`, `SUBMIT` | Same names |
| `SELECT` | `SELECT` with `mode: "single"`, `source: "sync"` |
| `ASYNC_SELECT`, `PAGINATED_SELECT`, `USER_SELECT` | `SELECT` with `mode: "single"`, `source: "async"` |
| `MULTI`, `MULTIPLE`, `SPECIAL_SELECT` | `SELECT` with `mode: "multiple"`, `source: "sync"` |
| `ASYNC_MULTI` | `SELECT` with `mode: "multiple"`, `source: "async"` |
| (none) | `CUSTOM`: a module's own lazily loaded control |
| `BUTTON`, `COLOR`, `DRAGNDROP`, `Formula`, `NUMBERS`, `OTP`, `PHONE`, `TABLE` | Not built yet; added to the constant when their field is |

## Async selects

A `SELECT` field with `source: "async"` loads its options page by page from `loadOptions(search, page, signal)`. The picker is a popover with its own search box:

- The field shows the chosen option's label. Opening it starts with an empty search; the chosen option is ticked in the list, or pinned under "Selected" when it is on another page or outside the search.
- Previous and Next are always present and keep focus in the search box, so paging never closes the list. While a page loads, the previous options stay on screen, dimmed.
- Enter in the search box picks the highlighted option; it never submits the surrounding form. Arrow keys move the highlight.
- Keep the `loadOptions` function stable (`useCallback`/`useMemo`): the options reload whenever the function changes.
