import { useRef, useState } from "react";
import { z } from "zod";
import { servicesApi } from "@/shared/api/generated/services";
import { settingsApi } from "@/shared/api/generated/settings";
import { sessionUserId } from "@/shared/auth/session-api";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { serviceSchema } from "@/shared/services/contracts";
import { providerSchema, providerAudit as audit, type Provider, type ProviderValues } from "../schemas/provider";
export function useProviderCommand(original: Provider | null, action: "save" | "delete", onDone: () => void) {
  const gate = usePermissionAction({
    kind: "all",
    permissions: ["CanViewContractors", action === "delete" ? "CanDeleteContractors" : original ? "CanEditContractors" : "CanCreateContractors"],
  });
  const { allowsNow } = useAccess();
  const running = useRef(false);
  const sent = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [read] = servicesApi.useLazyGetApiV1ServiceProvidersByIdQuery();
  const [readService] = servicesApi.useLazyGetApiV1ServicesByIdQuery();
  const [collections] = settingsApi.usePostApiV1CollectionMutation();
  const [create] = servicesApi.usePostApiV1ServiceProvidersMutation();
  const [update] = servicesApi.usePutApiV1ServiceProvidersByIdMutation();
  const [remove] = servicesApi.useDeleteApiV1ServiceProvidersByIdMutation();
  const run = async (v?: ProviderValues): Promise<string | null> => {
    const fail = (m: string) => {
      setError(m);
      return m;
    };
    if (running.current) return "A contractor change is already running.";
    const denied = gate.check();
    if (denied) return fail(denied);
    if (sent.current) return fail("A change was already sent. Inspect the contractor before repeating it.");
    const actor = sessionUserId();
    if (!actor) return fail("Sign in before changing contractors.");
    running.current = true;
    setBusy(true);
    setError("");
    let serviceReadNeeded = false;
    try {
      if (original) {
        const fresh = providerSchema.parse(await read({ ...audit, id: original.id }, false).unwrap());
        if (JSON.stringify(fresh) !== JSON.stringify(original)) return fail("This contractor changed. Close and review current details.");
      }
      if (action === "save") {
        if (!v?.country || !v.currency || !v.services.length) return fail("Complete country, currency and service selections.");
        const ref = await collections({ ...audit, body: ["Country", "Currency"] }).unwrap();
        if (!ref.Country?.some((r) => r.id === v.country?.value) || !ref.Currency?.some((r) => r.id === v.currency?.value))
          return fail("The selected country or currency is no longer available.");
        for (const selected of v.services) {
          if (original?.services.some((s) => s.id === selected.value)) continue;
          serviceReadNeeded = true;
          if (!allowsNow("CanViewServices")) return fail("Service read access is required to add a service association.");
          const service = serviceSchema.parse(await readService({ ...audit, id: selected.value }, false).unwrap());
          if (service.id !== selected.value || !service.isActive) return fail("New associations must identify an active service.");
        }
      }
      if (serviceReadNeeded && !allowsNow("CanViewServices")) return fail("Service access changed. Reopen the contractor.");
      const revoked = gate.check();
      if (revoked) return fail(revoked);
      if (sessionUserId() !== actor) return fail("The account changed. Reopen this contractor before saving.");
      sent.current = true;
      if (action === "delete" && original) {
        const result = await remove({ ...audit, id: original.id });
        if ("error" in result) return fail(apiErrorMessage(result.error));
      } else if (v?.country && v.currency) {
        const body = {
          name: v.name,
          address: v.address,
          email: v.email,
          phone: v.phone,
          countryId: v.country.value,
          currencyId: v.currency.value,
          serviceIds: v.services.map((s) => s.value),
        };
        const result = original
          ? await update({ ...audit, id: original.id, domainEntitiesServiceProvidersCreateServiceProviderRequest: body })
          : await create({ ...audit, domainEntitiesServiceProvidersCreateServiceProviderRequest: body });
        if ("error" in result) return fail(`${apiErrorMessage(result.error)} Inspect the contractor before repeating the save.`);
        const id = original?.id ?? ("data" in result ? z.uuid().safeParse(result.data).data : undefined);
        if (!id) return fail("The saved contractor identity was not confirmed. Inspect the register before creating another.");
        const verified = providerSchema.parse(await read({ ...audit, id }, false).unwrap());
        const expected = [...body.serviceIds].sort();
        if (
          verified.id !== id ||
          JSON.stringify(verified.services.map((s) => s.id).sort()) !== JSON.stringify(expected) ||
          verified.name !== body.name ||
          verified.address !== body.address ||
          verified.email !== body.email ||
          verified.phone !== body.phone ||
          verified.country?.id !== body.countryId ||
          verified.currency?.id !== body.currencyId
        )
          return fail(
            "The save was accepted, but the service associations were not confirmed. Inspect the contractor; the running backend may need the association repair.",
          );
      } else return fail("Select a saved contractor before deleting.");
      onDone();
      return null;
    } catch {
      return fail(
        sent.current
          ? "The contractor change or reconciliation was not confirmed. Inspect it before repeating the action."
          : "Current contractor or reference values could not be verified. No change was sent.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}
