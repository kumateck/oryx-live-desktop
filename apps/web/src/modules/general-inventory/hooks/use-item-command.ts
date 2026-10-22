import { useRef, useState } from "react";
import { z } from "zod";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { settingsApi } from "@/shared/api/generated/settings";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { sessionUserId } from "@/shared/auth/session-api";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { itemRule, type Store } from "@/shared/inventory/stores";
import { itemSchema, inventoryAudit as audit, type InventoryItem } from "@/shared/inventory/contracts";
import { itemBody, savedItemMatches, editorSchema, type ItemValues } from "../schemas/editor";
import { itemRegister, duplicateItem } from "../lib/register";
import { itemFilesApi } from "../api/files";
export function useItemCommand(original: InventoryItem | null, store: Store, action: "save" | "delete", onDone: (id?: string) => void) {
  const gate = usePermissionAction(itemRule(store, action === "delete" ? "delete" : original ? "edit" : "create"));
  const running = useRef(false);
  const sent = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [read] = inventoryApi.useLazyGetApiV1ItemsByIdQuery();
  const [list] = inventoryApi.useLazyGetApiV1ItemsQuery();
  const [reference] = settingsApi.usePostApiV1CollectionMutation();
  const [create] = inventoryApi.usePostApiV1ItemsMutation();
  const [update] = inventoryApi.usePutApiV1ItemsByIdMutation();
  const [remove] = inventoryApi.useDeleteApiV1ItemsByIdMutation();
  const [upload] = itemFilesApi.useAttachInventoryFilesMutation();
  const run = async (values?: ItemValues): Promise<string | null> => {
    const fail = (m: string) => {
      setError(m);
      return m;
    };
    if (running.current) return "An inventory change is already running.";
    const denied = gate.check();
    if (denied) return fail(denied);
    if (sent.current) return fail("A change was already sent. Inspect current inventory before making another change.");
    const actor = sessionUserId();
    if (!actor) return fail("Sign in before changing inventory.");
    if (original && original.store !== store) return fail("The item belongs to another store.");
    running.current = true;
    setBusy(true);
    setError("");
    try {
      if (original) {
        const fresh = itemSchema.parse(await read({ ...audit, id: original.id }, false).unwrap());
        if (JSON.stringify(fresh) !== JSON.stringify(original)) return fail("This item changed. Reopen it before continuing.");
        if (action === "delete" && fresh.availableQuantity !== 0) return fail("An item with stock cannot be deleted. Deactivate it instead.");
      }
      let body: ReturnType<typeof itemBody> | null = null;
      let files: File[] = [];
      if (action === "save") {
        const parsed = editorSchema.safeParse(values);
        if (!parsed.success) return fail("Complete all required inventory fields with valid whole-number stock levels.");
        body = itemBody(parsed.data, store);
        files = parsed.data.files;
        const [refs, rows] = await Promise.all([
          reference({ ...audit, body: ["UnitOfMeasure", "ItemCategory"] }).unwrap(),
          itemRegister((page) => list({ ...audit, store, page, pageSize: 100 }, false).unwrap(), store),
        ]);
        if (
          !refs.UnitOfMeasure?.some((u) => u.id === body?.unitOfMeasureId) ||
          (body.itemCategoryId && !refs.ItemCategory?.some((c) => c.id === body?.itemCategoryId))
        )
          return fail("The selected unit or category no longer exists.");
        if (duplicateItem(rows, body.name, body.code, original?.id)) return fail("Another item in this store already uses that name or code.");
      }
      if (original && action === "save") {
        const latest = itemSchema.parse(await read({ ...audit, id: original.id }, false).unwrap());
        if (JSON.stringify(latest) !== JSON.stringify(original)) return fail("This item changed during validation. Reopen it before saving.");
      }
      const revoked = gate.check();
      if (revoked) return fail(revoked);
      if (sessionUserId() !== actor) return fail("The signed-in account changed. Reopen the item.");
      if (action === "delete") {
        if (!original) return fail("Select a saved item before deleting.");
        sent.current = true;
        const result = await remove({ ...audit, id: original.id });
        if ("error" in result) return fail(apiErrorMessage(result.error));
        onDone();
        return null;
      }
      if (!body) return fail("Complete the inventory form.");
      sent.current = true;
      let id = original?.id;
      if (original) {
        const result = await update({ ...audit, id: original.id, domainEntitiesItemsCreateItemsRequest: body });
        if ("error" in result) return fail(apiErrorMessage(result.error));
      } else {
        const result = await create({ ...audit, domainEntitiesItemsCreateItemsRequest: body });
        if ("error" in result) return fail(apiErrorMessage(result.error));
        const identity = z.uuid().safeParse(result.data);
        if (!identity.success) return fail("The created item identity was not confirmed. Inspect inventory before creating another.");
        id = identity.data;
      }
      if (!id) return fail("The saved item identity was not confirmed.");
      setSavedId(id);
      const saved = itemSchema.parse(await read({ ...audit, id }, false).unwrap());
      if (saved.id !== id || !savedItemMatches(saved, body))
        return fail("The saved values could not be reconciled. Inspect this item before making another change.");
      if (files.length) {
        const blocked = gate.check();
        if (blocked || sessionUserId() !== actor) return fail(`Item saved. ${blocked ?? "Account changed before upload."}`);
        const result = await upload({ id, files });
        if ("error" in result)
          return fail(`Item saved. Attachment upload was not confirmed: ${apiErrorMessage(result.error)} Inspect existing files before uploading again.`);
      }
      onDone(id);
      return null;
    } catch {
      return fail(
        sent.current
          ? "The inventory change was not fully confirmed. Inspect current state before repeating it."
          : "Current inventory and reference values could not be verified. No change was sent.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, savedId, allowed: gate.allowed };
}
