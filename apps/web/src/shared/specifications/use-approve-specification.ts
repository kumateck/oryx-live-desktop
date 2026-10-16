import { useState } from "react";
import type { UnknownAction } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { authApi } from "@/shared/api/generated/auth";
import { apiErrorMessage } from "@/shared/errors/api-error-message";

/** The server's verifiable record types. */
export const VerifiableRecord = { Product: 0, MaterialSpecification: 1, ProductSpecification: 2, MaterialArd: 3, ProductArd: 4, RoutineArd: 5, MicrobialRequirement: 6 } as const;
export const VerifiableSpecification = { Material: VerifiableRecord.MaterialSpecification, Product: VerifiableRecord.ProductSpecification } as const;

/**
 * Approves (verifies) a specification or analytical raw data. The verification endpoint is shared by other records, so the caller passes the
 * action that refreshes its own lists instead of the endpoint carrying every module's tags.
 */
export function useApproveSpecification(modelType: (typeof VerifiableRecord)[keyof typeof VerifiableRecord], refresh: (id: string) => UnknownAction, audit: { module: string; subModule: string }) {
  const [verify] = authApi.usePostApiV1VerificationMutation();
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);
  return { busy, approve: async (id: string): Promise<string | null> => {
    setBusy(true);
    try {
      const result = await verify({ ...audit, sharedRequestsVerifyRequest: { modelType, modelId: id } });
      if ("error" in result) return apiErrorMessage(result.error);
      dispatch(refresh(id));
      return null;
    } finally { setBusy(false); }
  } };
}
