import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { itemPermissions, itemRule, inventoryLink } from "@/shared/inventory/stores";
import type { InventoryItem } from "@/shared/inventory/contracts";
import { useItemCommand } from "../hooks/use-item-command";
function Delete({ row, onClose }: { row: InventoryItem; onClose: () => void }) {
  const command = useItemCommand(row, row.store, "delete", () => {});
  return (
    <ConfirmActionDialog
      title="Delete inventory item"
      description={`Delete ${row.name}? Stock and historical references must be cleared by the server before deletion is allowed. Deactivate an item that must remain in the audit trail.`}
      require={itemRule(row.store, "delete")}
      confirmLabel="Delete item"
      busyLabel="Deleting…"
      onConfirm={() => command.run()}
      onClose={onClose}
    />
  );
}
export function ItemActions({ row, onChanged = () => {} }: { row: InventoryItem; onChanged?: () => void }) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<InventoryItem | null>(null);
  const p = itemPermissions(row.store);
  return (
    <>
      <TableMenu
        label={`Actions for ${row.name}`}
        items={[
          { id: "view", label: "View item", icon: Eye, require: p.view, onSelect: () => navigate(inventoryLink(row.store, `/${row.id}`)) },
          {
            id: "edit",
            label: "Edit item",
            icon: Pencil,
            require: itemRule(row.store, "edit"),
            onSelect: () => navigate(inventoryLink(row.store, `/${row.id}/edit`)),
          },
          {
            id: "delete",
            label: "Delete item",
            icon: Trash2,
            destructive: true,
            require: itemRule(row.store, "delete"),
            onSelect: () => setDeleting(structuredClone(row)),
          },
        ]}
      />
      {deleting ? (
        <Delete
          row={deleting}
          onClose={() => {
            setDeleting(null);
            onChanged();
          }}
        />
      ) : null}
    </>
  );
}
