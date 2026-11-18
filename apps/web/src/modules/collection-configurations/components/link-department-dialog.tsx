import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { useGetApiV1DepartmentQuery, usePutApiV1CollectionOperationsByOperationIdDepartmentAndDepartmentIdMutation } from "../api/collection-api";
import { productionDepartmentType } from "../lib/collections";
import { departmentOptionsSchema, linkDepartmentSchema, type CollectionRow, type LinkDepartmentValues } from "../schemas/collection-schema";

/** Links an unlinked operation to one production department. Only production departments are offered; the server checks again. */
export function LinkDepartmentDialog({ operation, require, audit, onClose }: {
  operation: CollectionRow;
  require: string;
  audit: { module: string; subModule: string };
  onClose: () => void;
}) {
  const departments = useGetApiV1DepartmentQuery({ ...audit, type: productionDepartmentType, page: 1, pageSize: 500 });
  const parsed = useMemo(() => departments.currentData ? departmentOptionsSchema.safeParse(departments.currentData) : null, [departments.currentData]);
  const options = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const [link, linking] = usePutApiV1CollectionOperationsByOperationIdDepartmentAndDepartmentIdMutation();
  const permission = usePermissionAction(require);
  const [error, setError] = useState("");
  const form = useForm<LinkDepartmentValues>({ resolver: zodResolver(linkDepartmentSchema), defaultValues: { department: null } });
  const loadError = departments.error ? apiErrorMessage(departments.error) : parsed && !parsed.success ? "The server returned departments this app could not read." : "";
  const fields = useMemo(() => [
    { type: InputTypes.SELECT, name: "department", label: "Production department", mode: "single", source: "sync", options, required: true,
      placeholder: departments.isLoading ? "Loading…" : options.length ? "Choose a production department" : "No production departments are set up" },
  ] as const satisfies readonly WizardField<LinkDepartmentValues>[], [options, departments.isLoading]);

  const save = form.handleSubmit(async (values) => {
    if (!values.department) return;
    const denied = permission.check();
    if (denied) { setError(denied); return; }
    setError("");
    const result = await link({ ...audit, operationId: operation.id, departmentId: values.department.value });
    if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
    toast.success(`Linked to ${values.department.label}`);
    onClose();
  });

  return <Dialog open onOpenChange={(open) => { if (!open && !linking.isLoading) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Link to a department</DialogTitle>
      <DialogDescription>{operation.name}</DialogDescription></DialogHeader>
    <form noValidate onSubmit={(event) => { event.preventDefault(); void save(); }} className="flex min-h-0 flex-1 flex-col gap-4">
      <DialogBody className="space-y-4">
        <p className="text-sm text-muted-foreground">The operation will be offered in this department&apos;s product procedures and shown on its production activity board.</p>
        <fieldset disabled={linking.isLoading}><FormWizard form={form} fields={fields} /></fieldset>
        {loadError ? <p role="alert" className="text-sm text-destructive">{loadError}</p> : null}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={linking.isLoading} onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={linking.isLoading || !permission.allowed || !options.length}>{linking.isLoading ? <><Spinner />Linking…</> : "Link department"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
