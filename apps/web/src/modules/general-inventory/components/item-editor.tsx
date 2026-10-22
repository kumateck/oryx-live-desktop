import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { settingsApi } from "@/shared/api/generated/settings";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { inventoryLink, stores, type Store } from "@/shared/inventory/stores";
import { inventoryAudit as audit, type InventoryItem } from "@/shared/inventory/contracts";
import { defaults, editorSchema, type ItemValues } from "../schemas/editor";
import { useItemCommand } from "../hooks/use-item-command";
const references = z.array(z.object({ id: z.uuid(), name: z.string() }));
export function ItemEditor({ original: initial, store }: { original: InventoryItem | null; store: Store }) {
  const [original] = useState(() => (initial ? structuredClone(initial) : null));
  const navigate = useNavigate();
  const command = useItemCommand(original, store, "save", (id) => {
    if (id) navigate(inventoryLink(store, `/${id}`));
  });
  const units = settingsApi.useGetApiV1CollectionByItemTypeQuery({ ...audit, itemType: "UnitOfMeasure" });
  const categories = settingsApi.useGetApiV1CollectionByItemTypeQuery({ ...audit, itemType: "ItemCategory" });
  const form = useForm<ItemValues>({ resolver: zodResolver(editorSchema), defaultValues: defaults(original) });
  const unitRows = references.safeParse(units.currentData);
  const categoryRows = references.safeParse(categories.currentData);
  if (units.isLoading || categories.isLoading) return <FormPageSkeleton label="Loading inventory references" sections={[8, 4]} />;
  if (units.error || categories.error || !unitRows.success || !categoryRows.success)
    return (
      <section role="alert" className="space-y-3">
        <p>
          {units.error
            ? apiErrorMessage(units.error)
            : categories.error
              ? apiErrorMessage(categories.error)
              : "Inventory reference values could not be verified."}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            void units.refetch();
            void categories.refetch();
          }}
        >
          Retry
        </Button>
      </section>
    );
  const options = (rows: { id: string; name: string }[]) => rows.map((r) => ({ value: r.id, label: r.name }));
  const fields: WizardField<ItemValues>[] = [
    { type: I.TEXT, name: "name", label: "Item name", required: true },
    { type: I.TEXT, name: "code", label: "Item code", required: true },
    { type: I.SELECT, mode: "single", source: "sync", name: "unit", label: "Unit of measure", required: true, options: options(unitRows.data) },
    { type: I.SELECT, mode: "single", source: "sync", name: "category", label: "Category", options: options(categoryRows.data) },
    {
      type: I.SELECT,
      mode: "single",
      source: "sync",
      name: "classification",
      label: "Classification",
      required: true,
      options: [
        { value: "0", label: "Recoverable" },
        { value: "1", label: "Non-recoverable" },
      ],
    },
    { type: I.NUMBER, name: "minimumLevel", label: "Minimum level", min: 0, step: 1, required: true },
    { type: I.NUMBER, name: "maximumLevel", label: "Maximum level", min: 0, step: 1, required: true },
    { type: I.NUMBER, name: "reorderLevel", label: "Reorder level", min: 0, step: 1, required: true },
    { type: I.SWITCH, name: "isActive", label: "Active item" },
    { type: I.TEXTAREA, name: "description", label: "Description", className: "md:col-span-2" },
    {
      type: I.UPLOAD,
      name: "files",
      label: "Attach documents",
      mode: "multiple",
      accept: ".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.xlsx",
      maxSizeBytes: 20 * 1024 * 1024,
      className: "md:col-span-2",
    },
  ];
  return (
    <section className="space-y-4">
      <PageHeader
        title={original ? `Edit ${original.name}` : "Create inventory item"}
        crumbs={[{ label: stores[store] ?? "Inventory store", to: inventoryLink(store) }, { label: original ? "Edit item" : "Create item" }]}
      />
      <p className="text-muted-foreground">
        Store: {stores[store]}. Stock levels use the selected unit. Referenced item codes, units and classifications cannot change.
      </p>
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((v) => {
          void command.run(v);
        })}
      >
        <fieldset disabled={command.busy || !command.allowed || !!command.savedId}>
          <FormWizard form={form} fields={fields} className="grid gap-4 md:grid-cols-2" />
        </fieldset>
        {command.error ? (
          <p role="alert" className="text-destructive">
            {command.error}
          </p>
        ) : null}
        {command.savedId ? (
          <Link className="underline" to={inventoryLink(store, `/${command.savedId}`)}>
            Inspect saved item and attachments
          </Link>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline">
            <Link to={inventoryLink(store)}>Back to inventory</Link>
          </Button>
          <Button disabled={command.busy || !command.allowed || !!command.savedId}>{command.busy ? "Saving…" : "Save item"}</Button>
        </div>
      </form>
    </section>
  );
}
