import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmActionDialog } from "@/shared/actions/confirm-action-dialog";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1CollectionByItemTypeQuery, useDeleteApiV1CollectionByItemTypeAndItemIdMutation, useDeleteApiV1CollectionUomByUomIdMutation } from "../api/collection-api";
import { collectionAudit, type CollectionDefinition } from "../lib/collections";
import { collectionRowsSchema, type CollectionRow } from "../schemas/collection-schema";
import { CollectionTable } from "./collection-table";

const ItemDialog = lazy(() => import("./item-dialog").then((module) => ({ default: module.ItemDialog })));
const UnitDialog = lazy(() => import("./unit-dialog").then((module) => ({ default: module.UnitDialog })));
const emptyRows: readonly CollectionRow[] = [];
type Editing = { kind: "create" } | { kind: "edit"; item: CollectionRow };

export function CollectionPanel({ definition, audit = collectionAudit, addLabel = "Add item", showHeading = true }: { definition: CollectionDefinition; audit?: { module: string; subModule: string }; addLabel?: string; showHeading?: boolean }) {
  const { has } = useAccess();
  const query = useGetApiV1CollectionByItemTypeQuery({ ...audit, itemType: definition.model,
    ...(definition.kind !== undefined ? { materialKind: definition.kind } : {}) }, { skip: !has(definition.permissions.view) });
  const [remove, removing] = useDeleteApiV1CollectionByItemTypeAndItemIdMutation();
  const [removeUnit, removingUnit] = useDeleteApiV1CollectionUomByUomIdMutation();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<CollectionRow | null>(null);
  const parsed = useMemo(() => query.currentData ? collectionRowsSchema.safeParse(query.currentData) : null, [query.currentData]);
  const all = parsed?.success ? parsed.data : emptyRows;
  const rows = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return all;
    return all.filter((item) => [item.name, item.description, item.symbol, item.code].some((value) => value?.toLocaleLowerCase().includes(needle)));
  }, [all, search]);
  const error = query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned collection items this app could not read." : null;
  const edit = useCallback((item: CollectionRow) => setEditing({ kind: "edit", item }), []);

  const confirmRemove = async () => {
    if (!deleting) return null;
    const result = definition.mode === "units"
      ? await removeUnit({ ...audit, uomId: deleting.id })
      : await remove({ ...audit, itemType: definition.model, itemId: deleting.id });
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success("Collection item removed");
    return null;
  };

  return <>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>{showHeading ? <h2 className="text-base font-semibold">{definition.label}</h2> : null}<p className="text-xs text-muted-foreground">{showHeading ? `${definition.group} · ` : ""}{all.length} items</p></div>
      <div className="flex min-w-0 flex-wrap gap-2">
        <Input aria-label={`Search ${definition.label.toLowerCase()}`} placeholder="Search items…" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full sm:w-56" />
        {definition.mode !== "read-only" ? <PermissionGuard require={definition.permissions.create}>
          <Button size="sm" disabled={!parsed?.success || Boolean(error)} onClick={() => setEditing({ kind: "create" })}>{addLabel}</Button>
        </PermissionGuard> : null}
      </div>
    </div>
    {definition.mode === "read-only" ? <p className="text-sm text-muted-foreground">Countries are available for selection. Adding or changing countries is not supported.</p> : null}
    <CollectionTable key={search} label={definition.label} rows={rows} definition={definition}
      busy={removing.isLoading || removingUnit.isLoading} onEdit={edit} onRemove={setDeleting}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} error={error}
      onRetry={() => { void query.refetch(); }} emptyTitle={search ? "No matching items" : "No items in this collection"} />
    {editing ? <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Opening form…</p>}>
      {definition.mode === "units"
        ? <UnitDialog {...(editing.kind === "edit" ? { id: editing.item.id } : {})} onClose={() => setEditing(null)} />
        : <ItemDialog audit={audit} definition={definition} rows={all} {...(editing.kind === "edit" ? { item: editing.item } : {})} onClose={() => setEditing(null)} />}
    </Suspense> : null}
    {deleting ? <ConfirmActionDialog require={definition.permissions.delete} title="Remove collection item" description={`Remove “${deleting.name}” from ${definition.label.toLowerCase()}? Check any workflows that rely on this item before removing it.`}
      confirmLabel="Remove" busyLabel="Removing…"
      onConfirm={confirmRemove} onClose={() => setDeleting(null)} /> : null}
  </>;
}
