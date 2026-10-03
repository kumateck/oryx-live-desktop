import { productPermissions } from "../lib/product-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductByProductIdPackagesQuery, usePostApiV1ProductByProductIdPackagesMutation } from "../api/product-api";
import { fromSavedPackages, toPackagesRequest, type PackagingLine } from "../lib/packaging";
import { savedPackagesSchema } from "../schemas/packaging-schema";

export const packagingAudit = { module: "Production", subModule: "Packing" } as const;
const none: PackagingLine[] = [];

/** A product's packing materials. The backend replaces the whole list on save, so edits are a draft until then. */
export function usePackaging(productId: string) {
  const query = useGetApiV1ProductByProductIdPackagesQuery({ ...packagingAudit, productId });
  const [save, mutation] = usePostApiV1ProductByProductIdPackagesMutation();
  const parsed = useMemo(() => query.isSuccess ? savedPackagesSchema.safeParse(query.data ?? null) : null, [query.isSuccess, query.data]);
  const saved = useMemo(() => parsed?.success ? fromSavedPackages(parsed.data) : none, [parsed]);
  const [draft, setDraft] = useState<PackagingLine[] | null>(null);
  const [message, setMessage] = useState("");
  const permission = usePermissionAction({ kind: "all", permissions: [productPermissions.edit], departmentType: 0 });
  const lines = draft ?? saved;

  const saveAll = async () => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setMessage("");
    if (lines.length === 0) { setMessage("Add at least one packing material."); return; }
    const result = await save({ ...packagingAudit, productId, body: toPackagesRequest(lines) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    setDraft(null);
    toast.success("Packing materials saved");
  };

  return {
    lines,
    dirty: draft !== null,
    loading: query.isLoading,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned packing materials the app could not read." : null,
    retry: () => { void query.refetch(); },
    saving: mutation.isLoading,
    message,
    setLines: (next: PackagingLine[]) => setDraft(next),
    discard: () => { setDraft(null); setMessage(""); },
    saveAll,
  };
}
