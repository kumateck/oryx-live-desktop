import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { useAccess } from "@/shared/auth/use-access";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { servicesApi } from "@/shared/api/generated/services";
import { usePartnerCollections } from "@/shared/reference-data/use-partner-collections";
import { providerEditorSchema, providerDefaults, providerAudit as audit, type Provider, type ProviderValues } from "../schemas/provider";
import { useProviderCommand } from "../hooks/use-provider-command";
export function ProviderEditor({ original = null, onClose }: { original?: Provider | null; onClose: () => void }) {
  const command = useProviderCommand(original, "save", onClose);
  const ref = usePartnerCollections();
  const dispatch = useApiDispatch();
  const { allowsNow } = useAccess();
  const form = useForm<ProviderValues>({ resolver: zodResolver(providerEditorSchema), defaultValues: providerDefaults(original) });
  const load = useCallback(
    async (searchQuery: string, page: number, signal: AbortSignal) => {
      if (!allowsNow("CanViewServices")) throw new Error("Service read access is required to search associations.");
      const request = dispatch(
        servicesApi.endpoints.getApiV1Services.initiate(
          { ...audit, searchQuery, page, pageSize: 30, isActive: true },
          { subscribe: false, forceRefetch: true },
        ),
      );
      const abort = () => request.abort();
      signal.addEventListener("abort", abort, { once: true });
      try {
        const result = await request.unwrap();
        if (signal.aborted || !allowsNow("CanViewServices")) throw new Error("Service search cancelled or access changed.");
        return {
          options: (result.data ?? []).flatMap((s) => (s.id && s.isActive ? [{ value: s.id, label: `${s.name ?? "Service"} · ${s.code ?? "No code"}` }] : [])),
          hasNext: (result.pageIndex ?? page) < (result.pageCount ?? page),
          hasPrevious: page > 1,
        };
      } finally {
        signal.removeEventListener("abort", abort);
      }
    },
    [dispatch, allowsNow],
  );
  const fields: WizardField<ProviderValues>[] = [
    { type: I.TEXT, name: "name", label: "Contractor name", required: true },
    { type: I.TEXT, name: "phone", label: "Telephone", required: true },
    { type: I.EMAIL, name: "email", label: "Email", required: true },
    { type: I.TEXTAREA, name: "address", label: "Address", required: true },
    { type: I.SELECT, name: "country", label: "Country", mode: "single", source: "sync", options: ref.countries, required: true },
    { type: I.SELECT, name: "currency", label: "Currency", mode: "single", source: "sync", options: ref.currencies, required: true },
    { type: I.SELECT, name: "services", label: "Provided services", mode: "multiple", source: "async", loadOptions: load, required: true },
  ];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !command.busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{original ? "Edit service provider" : "Create service provider"}</DialogTitle>
          <DialogDescription>Maintain contractor contacts, country/currency and every service association.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (v) => {
            await command.run(v);
          })}
        >
          <DialogBody>
            <fieldset disabled={command.busy || !command.allowed || ref.loading || !!ref.error}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {ref.error ? (
              <p role="alert">
                {ref.error}{" "}
                <Button type="button" variant="link" onClick={ref.retry}>
                  Retry choices
                </Button>
              </p>
            ) : null}
            {command.error ? (
              <p role="alert" className="text-destructive">
                {command.error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={command.busy} onClick={onClose}>
              Close
            </Button>
            <Button disabled={command.busy || !command.allowed || ref.loading || !!ref.error}>
              {command.busy ? "Saving and verifying…" : "Save contractor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
