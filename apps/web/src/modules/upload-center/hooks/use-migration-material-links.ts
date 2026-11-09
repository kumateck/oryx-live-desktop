import { useRef, useState } from "react";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { migrationAudit, stockMigrationApi, type MigrationDto } from "../api/stock-migration-api";
import { canLinkMaterial, materialLinkRequirement, type LinkKind } from "../lib/migration-material-links";
import { isDraft } from "../lib/stock-migration";

export function useMigrationMaterialLinks(migration: MigrationDto, kind: LinkKind, onBusy: (busy: boolean) => void) {
  const permission = usePermissionAction(materialLinkRequirement(kind));
  const user = useCurrentUser();
  const sameDepartment = Boolean(user?.departmentId && user.departmentId === migration.departmentId);
  const enabled = isDraft(migration) && permission.allowed && sameDepartment;
  const query = stockMigrationApi.useMaterialLinksQuery({ ...migrationAudit, id: migration.id ?? "", kind }, { skip: !enabled, refetchOnMountOrArgChange: true });
  const [create] = stockMigrationApi.useCreateMaterialLinksMutation();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const executing = useRef(false);
  const rows = query.currentData ?? [];
  const chosen = rows.filter((row) => row.materialId && selected.has(row.materialId) && canLinkMaterial(row));

  const link = async () => {
    if (executing.current || chosen.length === 0 || chosen.length > 1000 || query.isFetching || query.error) return;
    const denied = permission.check();
    if (denied || !isDraft(migration) || !sameDepartment) {
      setError(denied ?? "Linking requires a draft in your active department.");
      return;
    }
    executing.current = true;
    onBusy(true);
    setError("");
    setResult("");
    try {
      // The create-only endpoint re-resolves the draft and compares these preview defaults
      // under a transaction lock. Newly existing links are preserved, never upserted.
      const response = await create({ ...migrationAudit, id: migration.id ?? "", kind,
        domainEntitiesMaterialsStockMigrationsCreateStockMigrationMaterialLinksRequest: { materials: chosen } });
      if ("error" in response) setError(apiErrorMessage(response.error));
      else {
        setSelected(new Set());
        setResult(`${response.data.created ?? 0} material(s) linked; ${response.data.alreadyLinked ?? 0} already linked and preserved. Migration rows checked again.`);
      }
    } finally {
      executing.current = false;
      onBusy(false);
    }
  };

  return { query, rows, selected, setSelected, chosen, error, result, link, enabled };
}
