# Data tables

`apps/web/src/shared/datatable` replaces the Oryx Next datatables. Import from `@/shared/datatable`. All four tables share one view, so loading, error, empty, selection, sorting, and row opening behave the same everywhere.

| Table | Use for | Oryx Next equivalent |
| --- | --- | --- |
| `ServerDataTable` | Endpoints that page (and optionally sort) on the backend | `ServerDatatable` |
| `ClientDataTable` | Lists returned whole, paged and sorted in the browser | `ClientDatatable` |
| `ListDataTable` | Every row shown, no paging: form line items, short lists, totals | `ListsTable` |
| `DraggableDataTable` | Rows the user puts in order | `DraggableTable`, `MovableDatatable` |

## Columns

```tsx
const column = dataTableColumns<Role>();
const columns = column.columns([
  column.accessor("name", { header: "Role" }),
  column.accessor((role) => typeLabel(role.type), { id: "type", header: "Department type" }),
  column.display({ id: "actions", header: () => <span className="sr-only">Actions</span>, size: 130, cell: ({ row }) => <RoleMenu role={row.original} /> }),
]);
```

Define columns outside the component (or memoize them). `size` sets a column width in pixels; other columns share the remaining width and wrap their text, so the table never forces the page to scroll sideways.

## Required on every table

- `label`: the table's accessible name.
- `getRowId`: a stable ID for each row. Selection, drag order, and edits are keyed by it.
- `loading` (first load), `refreshing` (refetch with rows already shown), `error` and `onRetry`. With RTK Query: `loading={query.isLoading}`, `refreshing={query.isFetching && !query.isLoading}`, `error={query.error ? apiErrorMessage(query.error) : null}`.

## Server paging

```tsx
const table = useServerTable({ pageSize: 30 });
const query = useGetItemsQuery({ page: table.page, pageSize: table.pageSize, searchQuery: table.search });
const meta = pageMeta(query.data, table, query.data?.data?.length ?? 0);
<ServerDataTable label="Items" columns={columns} rows={query.data?.data} getRowId={(item) => item.id}
  page={meta.page} pageSize={meta.pageSize} totalRows={meta.totalRows}
  onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} ... />
```

Pass `sorting` and `onSortingChange` only when the endpoint sorts; otherwise headers are not sortable.

## Selection, row opening, editing, reordering

- `selection={{ selected, onChange }}` adds checkboxes. `selected` is a `Set` of row IDs.
- `onRowOpen={(row) => navigate(...)}` makes a row clickable and focusable (Enter opens it). Buttons, links, inputs, and menus inside the row work normally without extra configuration; add `data-row-click="ignore"` to any other element that should not open the row.
- `EditableTextCell`, `EditableNumberCell` (with an optional `prefix` such as a currency code), and `EditableSelectCell` go in a column's `cell`. They report a value when the user leaves the field or presses Enter; apply it with `updateRowById(rows, getRowId, id, patch)`.
- `DraggableDataTable` calls `onReorder(rows, { id, from, to })`. Rows move by dragging the handle or from the keyboard (Space to pick up, arrows to move, Space to drop, Escape to cancel).

## Problems in the Oryx Next tables that this fixes

| Problem | Fix |
| --- | --- |
| Rows were identified by position, so a selection made on server page 1 selected the same positions on page 2 | `getRowId` is required; selection is a set of IDs and survives paging, sorting, and refetching |
| "Next page" was enabled from `stopPageIndex`, the last page button shown, not the last page | Paging is computed from the total row count |
| A page past the end (after deletes or a narrower search) showed an empty table and "61 to 60 of 60" | The server table requests the last real page; the client table clamps to it; the range comes from the rows present |
| Client tables jumped to page 1 on every refetch | The page is kept and only clamped |
| Clicking a button or a dropdown item inside a row also opened the row, unless the column was flagged | Clicks on controls, on portalled menus and dialogs, during text selection, and with modifier keys are ignored automatically |
| Rows and sort headers could not be used from the keyboard | Rows are focusable and open with Enter; sort headers are buttons with `aria-sort` |
| A failed request looked the same as an empty list | Separate error state with Retry; an error during a refetch keeps the last rows and shows a notice |
| Every fetch replaced the rows with up to 150 skeleton rows | Skeleton (at most 8 rows) only before the first rows arrive; refetches keep the rows and mark the table busy |
| The page-size selector was blank when the size was not one of five fixed options | The size in use is always offered |
| Editable list cells wrote to the row at a position (wrong after sorting), updated state twice, and re-rendered the list per keystroke | Cells commit once, on blur or Enter, to the row with that ID; number entry never yields `NaN` |
| The draggable table used the row position as its ID by default and had no working keyboard reordering | IDs are required, duplicates lock reordering, keyboard reordering and screen-reader announcements are wired |
| Missing paging data from the backend produced `NaN` | `pageMeta` falls back to the requested page and the rows seen |

## Appearance and height

- The header row uses the active accent colour, and every second row is tinted.
- `ServerDataTable` and `ClientDataTable` fill the screen: give the page's top-level element the `page-fill` class and the table takes the remaining height. Rows scroll inside the table; the header and the paging footer are always visible. Pass `maxHeight` instead for a table inside a dialog or a form.
- `ListDataTable` and `DraggableDataTable` grow with their rows unless `maxHeight` or `fill` is set.

## Also available

- `columnToggle` (off by default, and not used on the migrated lists) adds a Columns menu for showing and hiding columns; the last visible column cannot be hidden, and `enableHiding: false` keeps a column permanently visible.
- `maxHeight="24rem"` makes rows scroll inside the table under a fixed header.
- `EditableComboboxCell` (searchable single choice) and `EditableMultiSelectCell` (searchable multiple choice) join the text, number, and select cells.

## Layout of the folder

- `components/`: the four tables, the shared view, and its parts (head, body, row, footer, page buttons, page-size select, column toggle, states, sortable row, option picker, editable cells).
- `hooks/`: table engine setup, row selection, server paging state, drag reordering, typing drafts, option picker state.
- `lib/`: pure functions and types (paging arithmetic, selection sets, row updates and moves, row-click rules, option search, column labels).

## Checking the tables by hand

`apps/web/datatable-preview.html` is a development-only page with all four tables on local sample rows. Run `bun run dev:web` and open `/datatable-preview.html`. It is not part of the production build. The tables were checked there at 1366×768: no sideways scrolling, sorting, paging, selection, row opening, the failure notice and retry, the editable cells, and reordering by keyboard and by pointer. They have not yet been used on a migrated screen with backend data other than Roles.
