import { useRef, useState } from "react";
import { z } from "zod";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { settingsApi } from "@/shared/api/generated/settings";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { sessionUserId } from "@/shared/auth/session-api";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { audit, vendorSchema, itemReadPermissions, type Vendor, type VendorValues } from "../schemas/vendor";
export function useVendorCommand(original: Vendor | null, action: "save" | "delete", onDone: () => void) {
  const require = action === "delete" ? "CanDeleteVendor" : original ? "CanUpdateVendorDetails" : "CanCreateVendor";
  const gate = usePermissionAction({ kind: "all", permissions: ["CanViewVendors", require] });
  const access = useAccess();
  const running = useRef(false);
  const sent = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [read] = inventoryApi.useLazyGetApiV1VendorsByIdQuery();
  const [item] = inventoryApi.useLazyGetApiV1ItemsByIdQuery();
  const [collections] = settingsApi.usePostApiV1CollectionMutation();
  const [create] = inventoryApi.usePostApiV1VendorsMutation();
  const [update] = inventoryApi.usePutApiV1VendorsByIdMutation();
  const [remove] = inventoryApi.useDeleteApiV1VendorsByIdMutation();
  const run = async (values?: VendorValues): Promise<string | null> => {
    const fail = (m: string) => {
      setError(m);
      return m;
    };
    if (running.current) return "A vendor change is already running.";
    const denied = gate.check();
    if (denied) return fail(denied);
    if (sent.current) return fail("A change was already sent. Close and inspect the vendor register before another save.");
    const actor = sessionUserId();
    if (!actor) return fail("Sign in before changing vendors.");
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const requiredItemPermissions = new Set<string>();
      if (original) {
        const fresh = vendorSchema.parse(await read({ ...audit, id: original.id }, false).unwrap());
        if (JSON.stringify(fresh) !== JSON.stringify(original)) return fail("This vendor changed. Reopen it and review the current values.");
      }
      if (action === "save") {
        if (!values?.country || !values.currency || !values.items.length) return fail("Complete the country, currency and vendor items.");
        const reference = await collections({ ...audit, body: ["Country", "Currency"] }).unwrap();
        if (!reference.Country?.some((r) => r.id === values.country?.value) || !reference.Currency?.some((r) => r.id === values.currency?.value))
          return fail("The selected country or currency no longer exists.");
        for (const selected of values.items) {
          if (original?.items.some((i) => i.item.id === selected.value)) continue;
          const row = await item({ ...audit, id: selected.value }, false).unwrap();
          const permission = row.store === undefined ? null : itemReadPermissions[row.store];
          if (permission) requiredItemPermissions.add(permission);
          if (row.id !== selected.value || !permission || !access.allowsNow(permission) || row.isActive !== true)
            return fail("New vendor items must be active and belong to a store you can read.");
        }
      }
      if ([...requiredItemPermissions].some((p) => !access.allowsNow(p))) return fail("Item access changed. Reopen the vendor before saving.");
      const revoked = gate.check();
      if (revoked) return fail(revoked);
      if (sessionUserId() !== actor) return fail("The signed-in account changed. Reopen the vendor.");
      sent.current = true;
      if (action === "delete" && original) {
        const result = await remove({ ...audit, id: original.id });
        if ("error" in result) return fail(apiErrorMessage(result.error));
      } else if (values?.country && values.currency) {
        const body = {
          name: values.name,
          address: values.address,
          phone: values.phone,
          email: values.email,
          contactPerson: values.contactPerson,
          countryId: values.country.value,
          currencyId: values.currency.value,
          itemIds: values.items.map((i) => i.value),
        };
        const result = original
          ? await update({ ...audit, id: original.id, domainEntitiesVendorsCreateVendorRequest: body })
          : await create({ ...audit, domainEntitiesVendorsCreateVendorRequest: body });
        if ("error" in result) return fail(`${apiErrorMessage(result.error)} Inspect the register before trying again.`);
        if (!original && !("data" in result && z.uuid().safeParse(result.data).success))
          return fail("The created vendor identity was not confirmed. Inspect the register before creating another.");
      } else return fail("Select a saved vendor before deleting.");
      onDone();
      return null;
    } catch {
      return fail(
        sent.current
          ? "The vendor change was not confirmed. Inspect current state before repeating it."
          : "The current vendor or reference values could not be verified. No change was sent.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}
