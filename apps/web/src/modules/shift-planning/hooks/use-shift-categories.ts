import { useEffect, useState } from "react";
import { readAllPages } from "@/shared/api/read-all-pages";
import { hrApi } from "../api/shift-api";
import { audit } from "../schemas/contracts";
import { z } from "zod";
const schema = z.array(z.object({ id: z.uuid(), name: z.string().min(1) }));
export function useShiftCategories() {
  const [read] = hrApi.useLazyGetApiV1ShiftCategoryQuery();
  const [state, setState] = useState<{ options: { value: string; label: string }[]; error: boolean }>({ options: [], error: false });
  useEffect(() => {
    const controller = new AbortController();
    readAllPages(
      (page) => read({ ...audit, page, pageSize: 100 }, false).unwrap(),
      (r) => r.id,
      controller.signal,
    )
      .then((rows) => {
        if (!controller.signal.aborted) setState({ options: schema.parse(rows).map((r) => ({ value: r.id, label: r.name })), error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ options: [], error: true });
      });
    return () => controller.abort();
  }, [read]);
  return state;
}
