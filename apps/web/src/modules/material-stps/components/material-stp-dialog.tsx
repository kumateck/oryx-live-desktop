import { useCallback, useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";
import { useNextSerial } from "@/shared/qc/qc-numbers";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { linkDelta } from "@/shared/specifications/specification-rules";
import { createdIds, stpDocumentSchema, stpNumber, StpOwner } from "@/shared/stp/stp-document";
import { stpAudit, stpDocumentApi, stpDocumentExtraApi } from "@/shared/stp/stp-document-api";
import { StpDialog, type StpDialogValues } from "@/shared/stp/stp-dialog";
import { linkedItems, stpRowsSchema, type Stp } from "@/shared/stp/stp-schema";
import { materialStpsApi } from "../api/material-stps-api";
import { kindName, stpPermissions, stpPrefix } from "../lib/material-stps";

const ownerType = StpOwner.Material;

/** Creates or edits a material STP: the STP first, then the materials it covers, then its document on every STP made. */
export function MaterialStpDialog({ kind, editing, onClose }: { kind: MaterialKind; editing: Stp | null; onClose: () => void }) {
  const permission = usePermissionAction(editing ? stpPermissions.edit[kind] : stpPermissions.create[kind]);
  const number = editing?.stpNumber ?? null;
  const links = materialStpsApi.useGetApiV1MaterialStpsByStpNumberMaterialsQuery(number ? { ...stpAudit, stpNumber: encodeURIComponent(number) } : skipToken);
  const documentQuery = stpDocumentApi.useGetApiV1StpDocumentsByOwnerTypeAndOwnerIdQuery(editing ? { ...stpAudit, ownerType, ownerId: editing.id } : skipToken);
  const document = useMemo(() => { const parsed = stpDocumentSchema.safeParse(documentQuery.data ?? null); return parsed.success ? parsed.data : null; }, [documentQuery.data]);
  const linked = useMemo(() => {
    const rows = stpRowsSchema.safeParse(links.data ?? []);
    const items = rows.success ? linkedItems(rows.data) : [];
    return items.length > 0 ? items : editing?.item ? [{ value: editing.item.id, label: editing.item.name }] : [];
  }, [links.data, editing]);
  const [create] = materialStpsApi.usePostApiV1MaterialStpsMutation();
  const [update] = materialStpsApi.usePutApiV1MaterialStpsByIdMutation();
  const [relink] = materialStpsApi.usePostApiV1MaterialStpsAddRemoveMaterialsMutation();
  const [upload] = stpDocumentExtraApi.useUploadStpDocumentVersionMutation();
  const [loadMaterials] = materialStpsApi.useLazyGetApiV1MaterialStpsUnusedMaterialsQuery();
  const nextSerial = useNextSerial();
  // After a create whose document failed to upload, the STPs exist: a retry only uploads, so nothing is created twice.
  const [created, setCreated] = useState<string[]>([]);
  const [linkedIds, setLinkedIds] = useState<string[] | null>(null);

  const loadItems = useMemo<SelectLoader>(() => async (search, page, signal) => {
    const request = loadMaterials({ ...stpAudit, kind, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    const seen = new Set<string>();
    return { options: (result.data ?? []).flatMap((material) => material.id && !seen.has(material.id) && seen.add(material.id)
      ? [{ value: material.id, label: `${material.name?.trim() || "Unnamed"}${material.code ? ` (${material.code})` : ""}` }] : []),
      hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1 };
  }, [loadMaterials, kind]);
  const suggestNumber = useCallback(async () => {
    const prefix = stpPrefix(kind);
    const serial = await nextSerial("MaterialSTPNumber", prefix);
    return serial === null ? null : stpNumber(prefix, serial);
  }, [nextSerial, kind]);

  const save = async (values: StpDialogValues): Promise<string | null> => {
    const denied = permission.check();
    if (denied) return denied;
    const body = { stpNumber: values.stpNumber, materialIds: values.items.map((item) => item.value), description: values.description ?? "" };
    let owners: string[];
    if (editing) {
      const result = await update({ ...stpAudit, id: editing.id, domainEntitiesMaterialStandardTestProceduresCreateMaterialStandardTestProcedureRequest: body });
      if ("error" in result) return apiErrorMessage(result.error);
      const delta = linkDelta(linkedIds ?? linked.map((item) => item.value), body.materialIds);
      if (delta.add.length > 0 || delta.remove.length > 0) {
        const linkedResult = await relink({ ...stpAudit, domainEntitiesMaterialStandardTestProceduresAddRemoveMaterialToStpRequest: { stpNumber: body.stpNumber, materialIdsToAdd: delta.add, materialIdsToRemove: delta.remove } });
        if ("error" in linkedResult) return `The STP was saved, but the materials were not changed: ${apiErrorMessage(linkedResult.error)} Save again to retry.`;
        setLinkedIds(body.materialIds);
      }
      owners = [editing.id];
    } else if (created.length > 0) {
      owners = created;
    } else {
      const result = await create({ ...stpAudit, domainEntitiesMaterialStandardTestProceduresCreateMaterialStandardTestProcedureRequest: body });
      if ("error" in result) return apiErrorMessage(result.error);
      owners = createdIds(result.data);
      setCreated(owners);
    }
    if (values.document) {
      if (owners.length === 0) return "The STP was saved, but the app could not tell which STPs were made, so the document was not attached. Edit the STP to attach it.";
      for (const [index, ownerId] of owners.entries()) {
        const revoked = permission.check();
        if (revoked) return `The STP was saved. ${revoked} The document was not attached.`;
        const result = await upload({ ownerType, ownerId, file: values.document, ...(values.reasonForChange ? { reasonForChange: values.reasonForChange } : {}) });
        if ("error" in result) {
          setCreated(editing ? [] : owners.slice(index));
          return `The STP was saved, but the document was not attached${owners.length > 1 ? ` to ${String(owners.length - index)} of ${String(owners.length)} STPs` : ""}: ${apiErrorMessage(result.error)} Save again to retry the document.`;
        }
      }
    }
    toast.success(editing ? "STP saved" : "STP created");
    return null;
  };

  if (editing && (links.isLoading || documentQuery.isLoading)) return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-md">
    <DialogHeader><DialogTitle>Edit {editing.number}</DialogTitle><DialogDescription>Loading the STP's materials and document.</DialogDescription></DialogHeader><div className="flex justify-center py-6"><Spinner /></div></DialogContent></Dialog>;
  const failed = editing ? links.error ?? documentQuery.error : undefined;
  if (failed) return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-md">
    <DialogHeader><DialogTitle>STP unavailable</DialogTitle><DialogDescription>{apiErrorMessage(failed)}</DialogDescription></DialogHeader>
    <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={() => { void links.refetch(); void documentQuery.refetch(); }}>Retry</Button></DialogFooter></DialogContent></Dialog>;
  return <StpDialog title={editing ? `Edit ${editing.number}` : `New ${kindName(kind)} material STP`} itemLabel={kind === 1 ? "Packaging materials" : "Raw materials"}
    saved={editing ? { number: editing.stpNumber ?? "", description: editing.description } : null} linked={linked} document={document}
    loadItems={loadItems} suggestNumber={editing ? null : suggestNumber} onSave={save} onClose={onClose} />;
}
