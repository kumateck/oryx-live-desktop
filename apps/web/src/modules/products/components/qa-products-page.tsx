import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { PageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1DepartmentByDepartmentIdQuery, useLazyGetApiV1DepartmentQuery } from "../api/product-api";
import { useProductWorkspace } from "../hooks/use-product-workspace";
import { useProductsList } from "../hooks/use-products-list";
import { ProductsTable } from "./products-table";

const audit = { module: "Quality Assurance", subModule: "Products" } as const;
const schema = z.object({ department: z.object({ value: z.uuid(), label: z.string() }, { message: "Choose a production department" }) });
type Values = z.infer<typeof schema>;

function DepartmentFilter({ departmentId, name }: { departmentId: string | null; name?: string | null }) {
  const [, setSearch] = useSearchParams();
  const [load] = useLazyGetApiV1DepartmentQuery();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: departmentId
    ? { department: { value: departmentId, label: name || "Selected department" } } : {} });
  const loader = useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...audit, type: 0, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    return { options: (result.data ?? []).flatMap(item => item.id && item.name && item.type === 0 ? [{ value: item.id, label: item.name }] : []),
      hasNext: page < (result.pageCount ?? page), hasPrevious: page > 1 };
  }, [load]);
  const fields = [{ type: InputTypes.SELECT, name: "department", label: "Production department", mode: "single", source: "async",
    loadOptions: loader, required: true, placeholder: "Choose a department" }] as const satisfies readonly WizardField<Values>[];
  const submit = form.handleSubmit(values => setSearch({ departmentId: values.department.value }));
  return <form onSubmit={event => void submit(event)} className="flex flex-wrap items-end gap-3">
    <div className="w-full min-w-0 sm:max-w-md"><FormWizard form={form} fields={fields} /></div>
    <Button type="submit" size="sm">Load products</Button>
  </form>;
}

function SelectedProducts({ departmentId }: { departmentId: string }) {
  const list = useProductsList(departmentId);
  const workspace = useProductWorkspace();
  const navigate = useNavigate();
  return <ProductsTable rows={list.rows} search={list.search} paging={list.paging} loading={list.loading}
    refreshing={list.refreshing} error={list.error} onRetry={list.retry} onOpen={product => void navigate(workspace.detailPath(product.id))} />;
}

export function QaProductsPage() {
  const { departmentId } = useProductWorkspace();
  const validId = z.uuid().safeParse(departmentId).success;
  const department = useGetApiV1DepartmentByDepartmentIdQuery({ ...audit, departmentId: departmentId ?? "" }, { skip: !validId });
  const selected = department.currentData;
  const validDepartment = selected?.id === departmentId && selected.type === 0;
  return <section className="page-fill">
    <div><h1 className="text-xl font-semibold">Products</h1>
      <p className="text-sm text-muted-foreground">Choose a production department to view and manage its products.</p></div>
    <DepartmentFilter key={`${departmentId}:${selected?.name ?? ""}`} departmentId={validId ? departmentId : null} name={selected?.name ?? null} />
    {!departmentId ? <p className="text-sm text-muted-foreground">Select a department and load its products to begin.</p>
      : department.isFetching ? <PageSkeleton label="Loading department" />
      : !validDepartment ? <div role="alert" className="space-y-2 text-sm"><p>{department.error ? apiErrorMessage(department.error) : "Choose a valid production department."}</p>
        {department.error ? <Button variant="outline" size="sm" onClick={() => void department.refetch()}>Retry department</Button> : null}</div>
      : <SelectedProducts key={departmentId} departmentId={departmentId} />}
  </section>;
}
