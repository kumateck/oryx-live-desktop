import { useParams, useSearchParams } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { PageHeader } from "@/shared/navigation/page-header";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { formatDateTime } from "@/shared/format/dates";
import { formatQuantityNumber, toLargestUnit } from "@/shared/units/quantity";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { inventoryLink, storeValue, stores, type Store } from "@/shared/inventory/stores";
import { itemSchema, classifications, inventoryAudit as audit, type InventoryItem } from "@/shared/inventory/contracts";
import { ItemActions } from "./item-actions";
import { ItemAttachments } from "./item-attachments";
import { ItemEditor } from "./item-editor";
function Summary({ row, refresh }: { row: InventoryItem; refresh: () => void }) {
  const level = (v: number) => `${formatQuantityNumber(v, "entered")} ${row.unitOfMeasure.symbol ?? row.unitOfMeasure.name}`;
  return (
    <article className="space-y-5">
      <PageHeader
        title={row.name}
        crumbs={[{ label: stores[row.store] ?? "Inventory store", to: inventoryLink(row.store) }, { label: row.code }]}
        actions={<ItemActions row={row} onChanged={refresh} />}
      />
      <KeyFacts>
        <KeyFact label="Code" value={row.code} />
        <KeyFact label="Store" value={stores[row.store]} />
        <KeyFact label="Status" value={row.isActive ? "Active" : "Inactive"} />
        <KeyFact label="Category" value={row.itemCategory?.name ?? "Not assigned"} />
        <KeyFact label="Classification" value={classifications[row.classification]} />
        <KeyFact label="Unit of measure" value={row.unitOfMeasure.name} />
        <KeyFact label="Available stock" value={toLargestUnit(row.availableQuantity, row.unitOfMeasure.symbol)?.text} />
        <KeyFact label="Minimum level" value={level(row.minimumLevel)} />
        <KeyFact label="Maximum level" value={level(row.maximumLevel)} />
        <KeyFact label="Reorder level" value={level(row.reorderLevel)} />
        <KeyFact label="Created" value={formatDateTime(row.createdAt)} />
        <KeyFact label="Created by" value={[row.createdBy?.firstName, row.createdBy?.lastName].filter(Boolean).join(" ") || "Not recorded"} />
      </KeyFacts>
      <section className="space-y-2">
        <h2 className="font-semibold">Description</h2>
        <p className="whitespace-pre-wrap break-words">{row.description || "No description"}</p>
      </section>
      <ItemAttachments row={row} />
    </article>
  );
}
function Existing({ id, store, edit }: { id: string; store: Store; edit: boolean }) {
  const query = inventoryApi.useGetApiV1ItemsByIdQuery({ ...audit, id }, { refetchOnMountOrArgChange: true });
  const parsed = itemSchema.safeParse(query.currentData);
  if (query.isLoading) return <DetailPageSkeleton label="Loading inventory item" />;
  if (query.error || !parsed.success || parsed.data.id !== id || parsed.data.store !== store)
    return (
      <section role="alert" className="space-y-3">
        <h1 className="font-semibold">Inventory item unavailable</h1>
        <p>{query.error ? apiErrorMessage(query.error) : "The item identity or store could not be verified."}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </section>
    );
  return edit ? <ItemEditor key={`${id}:${store}`} original={parsed.data} store={store} /> : <Summary row={parsed.data} refresh={() => void query.refetch()} />;
}
export function InventoryItemPage({ mode = "view" }: { mode?: "view" | "edit" | "create" }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const store = storeValue(params.get("storeType") ?? "1");
  if (store === undefined) return <p role="alert">Choose a valid inventory store.</p>;
  if (mode === "create") return <ItemEditor key={store} original={null} store={store} />;
  return id && z.uuid().safeParse(id).success ? (
    <Existing key={`${id}:${store}:${mode}`} id={id} store={store} edit={mode === "edit"} />
  ) : (
    <p role="alert">A valid item ID is required.</p>
  );
}
