import { useMemo } from "react";
import { Pencil, Power, Trash2, Users } from "lucide-react";
import { ServerDataTable, dataTableColumns, type ServerDataTableProps } from "@/shared/datatable";
import { TableMenu, TableMenuHeader } from "@/shared/actions/table-menu";
import { Badge } from "@/components/ui/badge";
import { delayLabel } from "@/modules/settings-support/forms";
import { eventLabels } from "../lib/events";
import type { AlertRecord } from "../schemas/alert-schema";

const column = dataTableColumns<AlertRecord>();
export type AlertAction = "edit" | "recipients" | "toggle" | "remove";
export function AlertsTable({ onAction, ...props }: Omit<ServerDataTableProps<AlertRecord>, "columns" | "getRowId"> & { onAction: (action: AlertAction, row: AlertRecord) => void }) {
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.title || eventLabels[row.notificationType], { id: "title", header: "Alert", cell: ({ row }) => <div><p className="font-medium break-words">{row.original.title || eventLabels[row.original.notificationType]}</p><p className="text-xs text-muted-foreground">{eventLabels[row.original.notificationType]}</p></div> }),
    column.accessor((row) => row.alertTypes.map((type) => type === 0 ? "Email" : "In-app").join(", ") || "None", { id: "channels", header: "Delivery" }),
    column.accessor((row) => `${row.roles.length} roles · ${row.users.length} users`, { id: "recipients", header: "Recipients" }),
    column.accessor((row) => delayLabel(row.timeFrame), { id: "delay", header: "Delay" }),
    column.display({ id: "status", header: "Status", cell: ({ row }) => <Badge variant="secondary">{row.original.isDisabled ? "Disabled" : "Enabled"}</Badge> }),
    column.display({ id: "actions", header: TableMenuHeader, size: 48, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.title || "alert"}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: "CanEditAlerts", disabled: !row.original.isConfigurable, ...(!row.original.isConfigurable ? { disabledReason: "System alerts cannot be edited." } : {}), onSelect: () => onAction("edit", row.original) },
      { id: "recipients", label: "Manage recipients", icon: Users, require: "CanEditAlerts", onSelect: () => onAction("recipients", row.original) },
      { id: "toggle", label: row.original.isDisabled ? "Enable" : "Disable", icon: Power, require: "CanEnableDisableAlerts", onSelect: () => onAction("toggle", row.original) },
      { id: "delete", label: "Remove", icon: Trash2, require: "CanDeleteAlerts", destructive: true, disabled: !row.original.isConfigurable, ...(!row.original.isConfigurable ? { disabledReason: "System alerts cannot be removed." } : {}), onSelect: () => onAction("remove", row.original) },
    ]} /> }),
  ]), [onAction]);
  return <ServerDataTable {...props} columns={columns} getRowId={(row) => row.id} />;
}
