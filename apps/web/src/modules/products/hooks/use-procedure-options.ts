import { useEffect, useMemo, useState } from "react";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1CollectionOperationsQuery, useGetApiV1ProductArdProductByProductIdQuery, usePostApiV1CollectionMutation } from "../api/product-api";
import { ardLabel } from "../lib/procedure-actions";
import { ardOptionSourceSchema } from "../schemas/procedure-schema";
import { procedureAudit } from "./use-procedure";

const kinds = ["WorkCenter", "Role", "User"] as const;
const empty: readonly SelectOption[] = [];

function options(items: readonly { id?: string | null; name?: string | null }[] | null | undefined): readonly SelectOption[] {
  return items ? items.flatMap((item) => item.id ? [{ value: item.id, label: item.name?.trim() || "Unnamed" }] : []) : empty;
}

/** The lists a procedure step chooses from: the department's operations, work centers, roles, users, and the product's analytical raw data. */
export function useProcedureOptions(productId: string, departmentId: string | null) {
  const operations = useGetApiV1CollectionOperationsQuery({ ...procedureAudit, departmentId: departmentId ?? "" }, { skip: !departmentId });
  const ard = useGetApiV1ProductArdProductByProductIdQuery({ ...procedureAudit, productId });
  const [loadCollection, collection] = usePostApiV1CollectionMutation();
  const [attempt, setAttempt] = useState(0);
  // Served by a POST endpoint, so it is requested once here rather than cached as a query.
  useEffect(() => { void loadCollection({ module: "General", subModule: "Collection", body: [...kinds] }); }, [loadCollection, attempt]);

  const lists = collection.data;
  const ardData = ard.data;
  const failure = operations.error ?? collection.error;
  const operationsRefetch = operations.refetch;
  return {
    operations: useMemo(() => options(operations.data), [operations.data]),
    workCenters: useMemo(() => options(lists?.WorkCenter), [lists]),
    roles: useMemo(() => options(lists?.Role), [lists]),
    users: useMemo(() => options(lists?.User), [lists]),
    ard: useMemo(() => {
      const parsed = ardOptionSourceSchema.safeParse(ardData ?? null);
      return parsed.success ? parsed.data.map((item) => ({ value: item.id, label: ardLabel(item.stpNumber ?? item.productStandardTestProcedure?.stpNumber, item.stage) })) : empty;
    }, [ardData]),
    loading: operations.isLoading || collection.isLoading || collection.isUninitialized,
    error: failure ? apiErrorMessage(failure) : null,
    retry: () => { setAttempt((value) => value + 1); if (departmentId) void operationsRefetch(); },
  };
}
export type ProcedureOptions = ReturnType<typeof useProcedureOptions>;
