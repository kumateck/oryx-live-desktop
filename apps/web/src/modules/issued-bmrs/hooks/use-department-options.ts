import { useEffect } from "react";
import { settingsApi } from "@/shared/api/generated/settings";

const { usePostApiV1CollectionMutation } = settingsApi;
const audit = { module: "General", subModule: "Collection" } as const;
const body = ["Department"];

/** Every department, from the shared reference list any signed-in user may read. */
export function useDepartmentOptions(): readonly { value: string; label: string }[] {
  const [load, state] = usePostApiV1CollectionMutation();
  useEffect(() => { void load({ ...audit, body }); }, [load]);
  return (state.data?.Department ?? []).flatMap((item) => item.id && item.name ? [{ value: item.id, label: item.name }] : [])
    .sort((a, b) => a.label.localeCompare(b.label));
}
