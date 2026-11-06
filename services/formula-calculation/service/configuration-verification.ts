import type { FormulaInput } from "../input";
import {
  FormulaIssueCode,
  FormulaIssueSeverity,
  type CompiledFormulaDefinitionV1,
  type FormulaIssue,
  decodeResolvedFormulaPlacements,
  hashResolvedFormulaConfiguration,
} from "../../../apps/web/src/shared/formula/core";

const options = {
  requireMethodReference: () => false,
  maxPlacements: 1,
  maxDependencyEdges: 500,
  maxPlacementKeyLength: 120,
  maxBindingsPerPlacement: 200,
  maxTargetsPerPlacement: 20,
  maxReferenceLength: 240,
  maxMethodReferenceLength: 500,
};

export type ConfigurationVerification =
  | {
      ok: true;
      computedHash: string;
      placementKey: string;
    }
  | {
      ok: false;
      computedHash: string | null;
      placementKey: string | null;
      issues: FormulaIssue[];
    };

const mismatchIssue = (): FormulaIssue => ({
  code: FormulaIssueCode.InvalidDefinition,
  severity: FormulaIssueSeverity.Error,
  path: "configurationHash",
  message: "Claimed configuration hash does not match the configuration.",
});

export const verifyServiceConfiguration = async (
  input: FormulaInput,
  claimedHash: string,
  definitionHash: string,
  definition: CompiledFormulaDefinitionV1,
): Promise<ConfigurationVerification> => {
  const decoded = decodeResolvedFormulaPlacements(
    [input],
    new Map([[definitionHash, definition]]),
    options,
  );
  if (!decoded.ok) {
    return {
      ok: false,
      computedHash: null,
      placementKey: null,
      issues: decoded.issues,
    };
  }
  const placement = decoded.placements[0];
  if (!placement) {
    return {
      ok: false,
      computedHash: null,
      placementKey: null,
      issues: [
        {
          code: FormulaIssueCode.InvalidDefinition,
          severity: FormulaIssueSeverity.Error,
          path: "configuration",
          message: "Exactly one formula configuration is required.",
        },
      ],
    };
  }
  const computedHash = await hashResolvedFormulaConfiguration(placement);
  if (computedHash !== claimedHash) {
    return {
      ok: false,
      computedHash,
      placementKey: placement.placementKey,
      issues: [mismatchIssue()],
    };
  }
  return { ok: true, computedHash, placementKey: placement.placementKey };
};
