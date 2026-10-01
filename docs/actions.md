# Action menus

Two shared components in `apps/web/src/shared/actions` replace hand-listed buttons. Both take the same `items` list.

| Component | Use it for |
| --- | --- |
| `TableMenu` | The actions of one table row, behind a "more" button in an `actions` column. |
| `DropdownButton` | A button that offers a choice of related actions, such as "Add specification" then the stage. |

```tsx
column.display({ id: "actions", header: TableMenuHeader, size: 56, cell: ({ row }) =>
  <TableMenu label={`Actions for ${row.original.name}`} items={[
    { id: "edit", label: "Edit", icon: Pencil, require: permissions.edit, onSelect: () => onEdit(row.original) },
    { id: "open", label: "Open record", icon: Eye, to: detailPath(row.original.id) },
    canRemove && { id: "remove", label: "Remove", icon: Trash2, destructive: true, separated: true, onSelect: () => onRemove(row.original) },
  ]} /> })

<DropdownButton label="Add specification" icon={Plus} items={stages.map((stage) =>
  ({ id: String(stage.value), label: stage.label, require: permissions.create, onSelect: () => open(stage.value) }))} />
```

## An item

| Field | Meaning |
| --- | --- |
| `id`, `label` | Required. `id` is unique within the menu. |
| `onSelect` or `to` | Run something, or open a page. One or the other. |
| `icon` | A Lucide icon. |
| `require` | A permission key or an access rule. Without it the user never sees the item. Each action has its own key. |
| `disabled`, `disabledReason` | Shown but not selectable, with the reason under the label. |
| `destructive` | Shown in red, for removing or blocking. |
| `separated` | A divider above the item. |

`false`, `null`, and `undefined` entries are skipped, so `condition && item` works.

## Rules

- A table's row actions go in a `TableMenu`, including a single action, so every table looks and behaves the same.
- Give the menu a `label` that names the row. It is what a screen reader announces and what tests look for.
- Do not wrap a menu in a permission check. Put `require` on the items; a menu with nothing the user may do renders nothing.
- A remove button inside a form row (one line of a repeating field) stays a plain button. It is part of the form, not a row action.

## What changed from Oryx Next

Kept: an `items` array with icon, label, link or handler, and a permission key per item; the menu disappearing when nothing is allowed.

Improved:

- **The menu button has a name.** Oryx Next's "more" button had no label, so it could not be announced or told apart from the next row's.
- **Keyboard selection works.** Items use the menu's select event; Oryx Next used a click handler on items and a link nested inside an item, so Enter on a link item did nothing.
- **A link item is the link**, so it can also be opened in a new tab.
- **One component for both menus.** Oryx Next had a row menu, a dropdown button, and a separate dropdown-of-links button, each with its own item shape; the dropdown buttons had no permission, icon, or disabled support.
- **A disabled item says why.**
- **Dividers are placed by the caller**, not drawn between every item.
- **Opening the menu does not trigger the row's click.**
- **Permissions are checked once**; Oryx Next filtered the items and then wrapped each in a guard again.

## Testing

`src/test/menu.ts` has `openMenu(name)` and `chooseAction(menuName, actionName)`. The menu opens on pointer down, which a plain click does not send in jsdom.
