import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import type { ActionEntry } from "@/shared/actions";
import { scheduleAddProductsPath, scheduleDetailPath, scheduleEditPath, schedulePermissions, scheduleRemoveProductsPath } from "./schedule-access";

/** What can be done with a schedule, for its row menu and its page. An ended schedule keeps the entries, with the reason they are off. */
export function scheduleActions(id: string, ended: boolean, withView: boolean): ActionEntry[] {
  const closed = ended ? { disabled: true, disabledReason: "This schedule has ended" } : {};
  return [
    withView && { id: "view", label: "View", icon: Eye, to: scheduleDetailPath(id) },
    { id: "edit", label: "Edit dates and remarks", icon: Pencil, require: schedulePermissions.edit, to: scheduleEditPath(id), ...closed },
    { id: "add", label: "Add products", icon: Plus, require: schedulePermissions.addProducts, to: scheduleAddProductsPath(id), ...closed },
    { id: "remove", label: "Remove products", icon: Trash2, require: schedulePermissions.removeProducts, to: scheduleRemoveProductsPath(id), destructive: true, separated: true, ...closed },
  ];
}
