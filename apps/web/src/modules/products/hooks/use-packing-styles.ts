import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductByProductIdPackingQuery, usePostApiV1ProductByProductIdPackingMutation } from "../api/product-api";
import { addStyle, fromSaved, removeStyle, toPackingRequest, updateStyle, type PackingStyle } from "../lib/packing-styles";
import { packingStyleListSchema, type PackingStyleFormValues } from "../schemas/packing-style-schema";

const audit = { module: "Production", subModule: "Packing Style" } as const;
const none: PackingStyle[] = [];

/**
 * A product's packing styles. The backend replaces the whole set in one request, so edits are kept
 * here as a draft until the user saves; `dirty` is true while the draft differs from what is saved.
 */
export function usePackingStyles(productId: string) {
  const query = useGetApiV1ProductByProductIdPackingQuery({ ...audit, productId });
  const [save, mutation] = usePostApiV1ProductByProductIdPackingMutation();
  const parsed = useMemo(() => query.data ? packingStyleListSchema.safeParse(query.data) : null, [query.data]);
  const saved = useMemo(() => parsed?.success ? fromSaved(parsed.data) : none, [parsed]);
  const [draft, setDraft] = useState<PackingStyle[] | null>(null);
  const [message, setMessage] = useState("");
  const styles = draft ?? saved;

  const saveAll = async () => {
    setMessage("");
    const result = await save({ ...audit, productId, body: toPackingRequest(styles) });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    setDraft(null);
    toast.success("Packing styles saved");
  };

  return {
    styles,
    dirty: draft !== null,
    loading: query.isLoading,
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned packing styles the app could not read." : null,
    retry: () => { void query.refetch(); },
    saving: mutation.isLoading,
    saveError: message,
    add: (values: PackingStyleFormValues) => setDraft(addStyle(styles, values, `new-${crypto.randomUUID()}`)),
    update: (key: string, values: PackingStyleFormValues) => setDraft(updateStyle(styles, key, values)),
    remove: (key: string) => setDraft(removeStyle(styles, key)),
    discard: () => { setDraft(null); setMessage(""); },
    saveAll,
  };
}
