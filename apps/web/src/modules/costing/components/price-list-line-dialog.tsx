import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormDialog } from "@/shared/forms/form-dialog";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { usePackingChoicesQuery, useSavePriceListLineMutation } from "../api/price-list-api";
import { useCurrencyOptions } from "../hooks/use-costing-choices";
import { packingOptionSchema, priceListAudit, priceListKeys, type PriceListDetail, type PriceListLine } from "../lib/price-lists";

const choice = z.object({ value: z.string().min(1), label: z.string() });
const schema = z.object({ packing: choice.nullable(), unpriced: z.boolean(), price: z.number().or(z.nan()).optional(), currency: choice.nullable() })
  .superRefine((values, ctx) => {
    if (!values.packing) ctx.addIssue({ code: "custom", path: ["packing"], message: "Choose a product and packing style" });
    if (!values.unpriced && (!values.price || !Number.isFinite(values.price) || values.price <= 0)) ctx.addIssue({ code: "custom", path: ["price"], message: "Enter a positive price per pack" });
    if (!values.unpriced && !values.currency) ctx.addIssue({ code: "custom", path: ["currency"], message: "Choose the currency" });
  });
type Values = z.infer<typeof schema>;

export function PriceListLineDialog({ revision, line, onClose, onSaved }: {
  revision: PriceListDetail; line: PriceListLine | null; onClose: () => void; onSaved: () => void;
}) {
  const [load] = usePackingChoicesQuery();
  const [save, saving] = useSavePriceListLineMutation();
  const currencies = useCurrencyOptions();
  const permission = usePermissionAction(priceListKeys.edit);
  const [message, setMessage] = useState("");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: {
    packing: line ? { value: `${line.productId}/${line.productPackingId}`, label: `${line.productCode ?? ""} · ${line.productName} / ${line.packingStyle}` } : null,
    unpriced: line?.price === null, price: line?.price ?? undefined,
    currency: line?.currencyId ? { value: line.currencyId, label: line.currencyName ?? line.currencySymbol ?? "Currency" } : null,
  } });
  const unpriced = useWatch({ control: form.control, name: "unpriced" });
  const loader = useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...priceListAudit, division: revision.division, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const parsed = packingOptionSchema.array().parse(result.data ?? []);
    return { options: parsed.map((item) => ({ value: `${item.productId}/${item.productPackingId}`,
      label: `${item.productCode ?? ""} · ${item.productName} / ${item.packingStyle}` })),
      hasNext: (result.pageIndex ?? page) < (result.pageCount ?? page), hasPrevious: page > 1 };
  }, [load, revision.division]);
  const fields = useMemo<readonly WizardField<Values>[]>(() => [
    { type: InputTypes.SELECT, name: "packing", label: "Product and packing style", mode: "single", source: "async", loadOptions: loader,
      required: true, disabled: Boolean(line), className: "md:col-span-2", placeholder: "Search product name, code or packing style" },
    { type: InputTypes.CHECKBOX, name: "unpriced", label: "Leave this packing style unpriced", className: "md:col-span-2" },
    ...(unpriced ? [] : [
      { type: InputTypes.NUMBER, name: "price", label: "Price per complete pack", min: 0, required: true } as const,
      { type: InputTypes.SELECT, name: "currency", label: "Priced in", mode: "single", source: "sync", options: currencies.options, required: true } as const,
    ]),
  ], [loader, line, unpriced, currencies.options]);
  const submit = form.handleSubmit(async (values) => {
    const ids = z.tuple([z.uuid(), z.uuid()]).safeParse(values.packing?.value.split("/"));
    if (!ids.success) { setMessage("Choose a valid product packing style."); return; }
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const [productId, productPackingId] = ids.data;
    setMessage("");
    const result = await save({ ...priceListAudit, id: revision.id, domainEntitiesCostingSaveCostingPriceListLineRequest: {
      version: revision.version, productId, productPackingId, price: values.unpriced ? null : values.price ?? null,
      currencyId: values.unpriced ? null : values.currency?.value ?? null, priceUoM: "pack",
    } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    onSaved(); onClose();
  });
  return <FormDialog allowed={permission.allowed} title={line ? "Change pack price" : "Add product pack price"}
    description="This price applies to one complete pack of the selected packing style. Another style has its own price."
    form={form} fields={fields} submitLabel="Save pack price" busy={saving.isLoading} message={message}
    onSubmit={(event) => void submit(event)} onClose={onClose} />;
}
