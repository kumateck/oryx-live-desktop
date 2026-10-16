import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { useForm, useWatch } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/shared/auth/session-provider";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { useNextSerial } from "@/shared/qc/qc-numbers";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import {
  checkRevisionDate, documentReferences, earliestRevisionDate, linkDelta, productSpecificationPrefix, serialNumber, specificationBaseSchema, specificationBody, specificationDefaults, testStages,
} from "@/shared/specifications/specification-rules";
import { specificationRowsSchema, specificationSchema, type Specification } from "@/shared/specifications/specification-schema";
import { SpecificationUnavailable } from "@/shared/specifications/specification-views";
import { useTemplateLoader } from "@/shared/specifications/use-template-loader";
import { productSpecificationChanged, productSpecificationsApi } from "../api/product-specifications-api";
import { audit, completePath, detailPath, listPath, specPermissions } from "../lib/product-specifications";

const option = z.object({ value: z.string(), label: z.string() });
const schema = specificationBaseSchema.extend({
  products: z.array(option).min(1, "Choose at least one product."),
  testStage: option.nullable().refine((value): boolean => value !== null, "Choose the test stage."),
}).superRefine(checkRevisionDate);
type Values = z.input<typeof schema>;
const years = { fromYear: 2000, toYear: 2100 } as const;
const stageOf = (value: string | undefined) => value === "1" ? 1 : value === "2" ? 2 : 0;
const productLabel = (item: { name?: string | null; code?: string | null }) => `${item.name?.trim() || "Unnamed"}${item.code ? ` (${item.code})` : ""}`;

function Editor({ saved, linked }: { saved: Specification | null; linked: readonly SelectOption[] }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useSession();
  const userId = state.status === "authenticated" ? state.session.user.id : null;
  const require = saved ? specPermissions.edit : specPermissions.create;
  const permission = usePermissionAction(require);
  const savedStage = saved ? testStages.find((stage) => stage.value === String(saved.testStage)) ?? null : null;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: saved ? { ...specificationDefaults(saved), products: [...linked], testStage: savedStage }
    : { specificationNumber: "", revisionNumber: "", supersedesNumber: "", reference: null, description: "", products: [], testStage: null } });
  const effectiveDate = useWatch({ control: form.control, name: "effectiveDate" });
  const stage = useWatch({ control: form.control, name: "testStage" });
  const products = useWatch({ control: form.control, name: "products" });
  void form.formState.errors;
  const earliest = useMemo(() => earliestRevisionDate(effectiveDate), [effectiveDate]);
  const [create] = productSpecificationsApi.usePostApiV1ProductSpecificationsMutation();
  const [update] = productSpecificationsApi.usePutApiV1ProductSpecificationsByIdMutation();
  const [relink] = productSpecificationsApi.usePostApiV1ProductSpecificationsAddRemoveProductsMutation();
  const [findByNumber] = productSpecificationsApi.useLazyGetApiV1ProductSpecificationsProductsQuery();
  const [loadProducts] = productSpecificationsApi.useLazyGetApiV1ProductSpecificationsProductsNotLinkedQuery();
  const loadTemplates = useTemplateLoader();
  const nextSerial = useNextSerial();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [linkedIds, setLinkedIds] = useState(() => linked.map((item) => item.value));
  // The division of each product offered, so the number series can follow the first product chosen.
  const divisions = useRef(new Map<string, number | null>());

  const firstProduct = products?.[0]?.value ?? null;
  useEffect(() => {
    if (saved || !stage || !firstProduct) return;
    const prefix = productSpecificationPrefix(divisions.current.get(firstProduct), stageOf(stage.value));
    if (!prefix) return;
    let current = true;
    void nextSerial("ProductSpecNumber", prefix).then((serial) => {
      if (current && serial !== null && !form.getFieldState("specificationNumber").isDirty) form.setValue("specificationNumber", serialNumber(prefix, serial));
    });
    return () => { current = false; };
  }, [saved, stage, firstProduct, nextSerial, form]);

  const loadOptions = useMemo<SelectLoader>(() => async (search, page, signal) => {
    const request = loadProducts({ ...audit, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return { options: (result.data ?? []).flatMap((product) => {
      if (!product.id) return [];
      divisions.current.set(product.id, product.division ?? null);
      return [{ value: product.id, label: productLabel(product) }];
    }), hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1 };
  }, [loadProducts]);

  const fields = useMemo(() => [
    { type: InputTypes.SELECT, mode: "multiple", source: "async", name: "products", label: "Products", required: true, loadOptions, placeholder: "Select products", searchPlaceholder: "Search products",
      description: "Only products without a specification are offered. The first product's division sets the number series.", className: "md:col-span-2" },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "testStage", label: "Test stage", required: true, options: testStages, placeholder: "Select a stage" },
    { type: InputTypes.TEXT, name: "specificationNumber", label: "Specification number", required: true },
    { type: InputTypes.DATE, name: "effectiveDate", label: "Effective date", required: true, ...years },
    { type: InputTypes.DATE, name: "reviewDate", label: "Revision date", required: true, minDate: earliest, ...years, description: "After the effective date and after today." },
    { type: InputTypes.TEXT, name: "revisionNumber", label: "Revision", required: true },
    { type: InputTypes.TEXT, name: "supersedesNumber", label: "Supersedes", required: true, placeholder: "The number this replaces, or None" },
    { type: InputTypes.SELECT, mode: "single", source: "sync", name: "reference", label: "Reference", options: documentReferences, placeholder: "Select a pharmacopoeia" },
    { type: InputTypes.SELECT, mode: "single", source: "async", name: "form", label: "Template", required: true, loadOptions: loadTemplates, placeholder: "Select a template", searchPlaceholder: "Search templates",
      description: "The tests of the specification come from this template." },
    { type: InputTypes.RICHTEXT, name: "description", label: "Notes", rows: 4, className: "md:col-span-2" },
  ] as const satisfies readonly WizardField<Values>[], [earliest, loadOptions, loadTemplates]);

  const submit = form.handleSubmit(async (raw) => {
    const values = schema.parse(raw);
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    const productIds = values.products.map((item) => item.value);
    const testStage = stageOf(values.testStage?.value);
    setSaving(true);
    try {
      if (!saved) {
        if (!userId) { setMessage("Your session could not be identified. Sign in again and retry."); return; }
        const result = await create({ ...audit, domainEntitiesProductSpecificationsCreateProductSpecificationRequest: { ...specificationBody(values), testStage, userId, productIds } });
        if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
        dispatch(productSpecificationChanged(null));
        toast.success("Specification created");
        // Specifications are kept per product, so the record to complete is found by its number.
        const found = await findByNumber({ ...audit, specificationNumber: values.specificationNumber }).unwrap().catch(() => null);
        const id = specificationRowsSchema.safeParse(found ?? []).data?.[0]?.id ?? result.data;
        void navigate(id ? completePath(id) : listPath);
        return;
      }
      const updated = await update({ ...audit, id: saved.id, domainEntitiesProductSpecificationsUpdateProductSpecificationRequest: { ...specificationBody(values, saved.dueDate), testStage } });
      if ("error" in updated) { setMessage(apiErrorMessage(updated.error)); return; }
      dispatch(productSpecificationChanged(saved.id));
      const delta = linkDelta(linkedIds, productIds);
      if (delta.add.length > 0 || delta.remove.length > 0) {
        const denied = permission.check();
        if (denied) { setMessage(`The specification was saved, but the products were not changed. ${denied}`); return; }
        const linkedResult = await relink({ ...audit, domainEntitiesProductSpecificationsAddRemoveProductToSpecificationRequest: { specificationNumber: values.specificationNumber, productIdsToAdd: delta.add, productIdsToRemove: delta.remove } });
        if ("error" in linkedResult) { setMessage(`The specification was saved, but the products were not changed: ${apiErrorMessage(linkedResult.error)} Save again to retry the products.`); return; }
        setLinkedIds(productIds);
      }
      toast.success("Specification saved");
      void navigate(completePath(saved.id));
    } finally { setSaving(false); }
  });

  const title = saved ? `Edit ${saved.number}` : "New product specification";
  return <article className="min-w-0 space-y-4">
    <PageHeader title={title} crumbs={[{ label: "Product specifications", to: listPath }, ...(saved ? [{ label: saved.number, to: detailPath(saved.id) }] : []), { label: saved ? "Edit" : "New" }]}
      actions={<PermissionGuard require={require}><Button type="button" variant="outline" disabled={saving} onClick={() => void navigate(saved ? detailPath(saved.id) : listPath)}>Cancel</Button>
        <Button type="submit" form="product-specification" disabled={saving}>{saving ? <><Spinner />Saving…</> : saved ? "Save and set references" : "Create and set references"}</Button></PermissionGuard>} />
    <form id="product-specification" noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
      <div className="rounded-lg border bg-card p-4"><FormWizard form={form} fields={fields} className="md:grid-cols-2" /></div>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <p className="text-sm text-muted-foreground">After saving, choose the pharmacopoeia reference for each test of the template.</p>
    </form>
  </article>;
}

export function NewProductSpecificationPage() {
  return <Editor saved={null} linked={[]} />;
}

/** Editing a specification: its fields, and the products linked to its number. */
export function EditProductSpecificationPage() {
  const { id } = useParams();
  const query = productSpecificationsApi.useGetApiV1ProductSpecificationsByIdQuery(id ? { ...audit, id } : skipToken);
  const spec = useMemo(() => query.data ? specificationSchema.safeParse(query.data) : null, [query.data]);
  const number = spec?.success ? spec.data.specificationNumber : null;
  const links = productSpecificationsApi.useGetApiV1ProductSpecificationsProductsQuery(number ? { ...audit, specificationNumber: number } : skipToken);
  const linked = useMemo(() => {
    const rows = specificationRowsSchema.safeParse(links.data ?? []);
    const items = (rows.success ? rows.data : []).flatMap((row) => row.item ? [{ value: row.item.id, label: productLabel(row.item) }] : []);
    const own = spec?.success ? spec.data.item : null;
    return items.length > 0 ? items : own ? [{ value: own.id, label: productLabel(own) }] : [];
  }, [links.data, spec]);
  if (query.isLoading || links.isLoading) return <FormPageSkeleton label="Loading specification" />;
  if (!spec?.success) return <SpecificationUnavailable message={query.error ? apiErrorMessage(query.error) : "The server returned a specification the app could not read."}
    onRetry={() => void query.refetch()} back={{ label: "Product specifications", to: listPath }} />;
  if (links.error) return <SpecificationUnavailable message={`The linked products could not be loaded: ${apiErrorMessage(links.error)}`} onRetry={() => void links.refetch()} back={{ label: "Product specifications", to: listPath }} />;
  return <Editor key={spec.data.id} saved={spec.data} linked={linked} />;
}
