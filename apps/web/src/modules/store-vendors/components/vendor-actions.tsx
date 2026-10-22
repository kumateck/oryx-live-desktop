import { lazy, Suspense, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { TableMenu, ConfirmActionDialog } from "@/shared/actions";
import { useVendorCommand } from "../hooks/use-vendor-command";
import type { Vendor } from "../schemas/vendor";
import { VendorDetail } from "./vendor-detail";
const Editor = lazy(() => import("./vendor-editor").then((m) => ({ default: m.VendorEditor })));
function Delete({ row, onClose }: { row: Vendor; onClose: () => void }) {
  const command = useVendorCommand(row, "delete", () => {});
  return (
    <ConfirmActionDialog
      title="Delete store vendor"
      description={`Remove ${row.name} from the active vendor register? Historical procurement records remain on the server. The backend does not validate existing vendor links before soft deletion.`}
      require="CanDeleteVendor"
      confirmLabel="Delete vendor"
      busyLabel="Deleting…"
      onConfirm={() => command.run()}
      onClose={onClose}
    />
  );
}
export function VendorActions({ row }: { row: Vendor }) {
  const [selected, setSelected] = useState<{ action: "view" | "edit" | "delete"; row: Vendor } | null>(null);
  return (
    <>
      <TableMenu
        label={`Actions for ${row.name}`}
        items={[
          {
            id: "view",
            label: "View vendor",
            icon: Eye,
            require: "CanViewVendors",
            onSelect: () => setSelected({ action: "view", row: structuredClone(row) }),
          },
          {
            id: "edit",
            label: "Edit vendor",
            icon: Pencil,
            require: "CanUpdateVendorDetails",
            onSelect: () => setSelected({ action: "edit", row: structuredClone(row) }),
          },
          {
            id: "delete",
            label: "Delete vendor",
            icon: Trash2,
            destructive: true,
            require: "CanDeleteVendor",
            onSelect: () => setSelected({ action: "delete", row: structuredClone(row) }),
          },
        ]}
      />
      {selected?.action === "edit" ? (
        <Suspense fallback={<p role="status">Loading vendor editor…</p>}>
          <Editor original={selected.row} onClose={() => setSelected(null)} />
        </Suspense>
      ) : selected?.action === "delete" ? (
        <Delete row={selected.row} onClose={() => setSelected(null)} />
      ) : selected ? (
        <VendorDetail row={selected.row} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}
