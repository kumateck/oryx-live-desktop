import { useRef, useState } from "react";
import { z } from "zod";
import { servicesApi } from "@/shared/api/generated/services";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { sessionUserId } from "@/shared/auth/session-api";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { serviceSchema, servicesAudit as audit, type StoreService } from "@/shared/services/contracts";
import { readServiceRegister, serviceNamingProblem } from "@/shared/services/read-register";
import { serviceFilesApi } from "../api/service-files";
import type { ServiceValues } from "../schemas/editor";
export function useServiceSave(original: StoreService | null, onDone: () => void) {
  const gate = usePermissionAction({ kind: "all", permissions: ["CanViewServices", original ? "CanEditService" : "CanCreateService"] });
  const running = useRef(false);
  const sent = useRef(false);
  const saved = useRef<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [register] = servicesApi.useLazyGetApiV1ServicesQuery();
  const [read] = servicesApi.useLazyGetApiV1ServicesByIdQuery();
  const [create] = servicesApi.usePostApiV1ServicesMutation();
  const [update] = servicesApi.usePutApiV1ServicesByIdMutation();
  const [upload] = serviceFilesApi.useAttachServiceFilesMutation();
  const run = async (v: ServiceValues) => {
    if (running.current) return;
    const fail = (m: string) => setError(m);
    const denied = gate.check();
    if (denied) return fail(denied);
    if (sent.current) return fail("A save was already sent. Inspect the service before making another change.");
    if (!v.start || !v.end) return fail("Choose both service dates.");
    const actor = sessionUserId();
    if (!actor) return fail("Sign in before saving the service.");
    running.current = true;
    setBusy(true);
    setError("");
    try {
      if (original) {
        const current = serviceSchema.parse(await read({ ...audit, id: original.id }, false).unwrap());
        if (JSON.stringify(original) !== JSON.stringify(current)) return fail("This service changed. Close and review its current values.");
      }
      const rows = await readServiceRegister(
        (isActive, page) => register({ ...audit, isActive, page, pageSize: 100 }, false).unwrap(),
        new AbortController().signal,
      );
      const duplicate = serviceNamingProblem(rows, v.name, v.code, original?.id);
      if (duplicate) return fail(duplicate);
      const date = (value: Date, previous: string | undefined) =>
        previous && value.toDateString() === new Date(previous.slice(0, 10) + "T00:00:00").toDateString()
          ? previous
          : `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}T00:00:00Z`;
      const body = {
        name: v.name,
        code: v.code,
        description: v.description,
        startDate: date(v.start, original?.startDate),
        endDate: date(v.end, original?.endDate),
      };
      const revoked = gate.check();
      if (revoked) return fail(revoked);
      if (sessionUserId() !== actor) return fail("The signed-in account changed. Reopen the service.");
      sent.current = true;
      if (original) {
        const result = await update({ ...audit, id: original.id, domainEntitiesServicesCreateServiceRequest: body });
        if ("error" in result) return fail(apiErrorMessage(result.error));
        saved.current = original.id;
      } else {
        const result = await create({ ...audit, domainEntitiesServicesCreateServiceRequest: body });
        if ("error" in result) return fail(`${apiErrorMessage(result.error)} Inspect the register before creating another service.`);
        const id = z.uuid().safeParse(result.data);
        if (!id.success) return fail("The saved service identity was not confirmed. Inspect the register before creating another.");
        saved.current = id.data;
      }
      const id = saved.current;
      if (!id) return fail("The saved service identity was not confirmed.");
      setSavedId(id);
      if (v.files.length) {
        const fileDenied = gate.check();
        if (fileDenied || sessionUserId() !== actor) return fail(`Service saved. ${fileDenied ?? "The account changed before attachment upload."}`);
        const files = await upload({ id, files: v.files });
        if ("error" in files)
          return fail(
            `Service saved. Attachment upload was not confirmed: ${apiErrorMessage(files.error)} Inspect existing files before uploading again; the service will not be recreated.`,
          );
      }
      onDone();
    } catch {
      fail(
        saved.current
          ? "Service saved. The attachment stage was not confirmed. Inspect the service before uploading again."
          : sent.current
            ? "The service save was not confirmed. Inspect the register before repeating it."
            : "The existing service could not be verified. No save was sent.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, savedId, allowed: gate.allowed };
}
