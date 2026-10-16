import { useState } from "react";
import { FileCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { routinesApi } from "@/modules/qc-routines/api/routines-api";
import { ConfirmActionDialog } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";

export const commercialCoaPath = (id: string) => `/qc/commercial-certificates/${id}`;
const checkers = { material: { kind: "some" as const, permissions: ["CanCheckRawMaterialTestResult", "CanCheckPackagingMaterialTestResult"] }, product: "CanCheckProductTest" };

/**
 * Generates the commercial certificate of analysis for an approved material batch or product test request: a fixed copy of
 * its approved chemical and microbial results. Shown only once the record is approved; confirmed before it is made.
 */
export function GenerateCoaButton({ approved, target }: { approved: boolean; target: { materialBatchId: string } | { analyticalTestRequestId: string } }) {
  const navigate = useNavigate();
  const [material] = routinesApi.useGenerateMaterialCoaMutation();
  const [product] = routinesApi.useGenerateProductCoaMutation();
  const [confirming, setConfirming] = useState(false);
  if (!approved) return null;
  const require = "materialBatchId" in target ? checkers.material : checkers.product;
  return <PermissionGuard require={require}>
    <Button variant="outline" onClick={() => setConfirming(true)}><FileCheck />Generate approved COA</Button>
    {confirming ? <ConfirmActionDialog require={require} destructive={false} title="Generate the certificate of analysis?" description="The certificate is a fixed copy of the approved results and cannot be changed afterwards."
      confirmLabel="Generate" busyLabel="Generating…" onClose={() => setConfirming(false)}
      onConfirm={async () => {
        const result = "materialBatchId" in target ? await material(target.materialBatchId) : await product(target.analyticalTestRequestId);
        if ("error" in result) return apiErrorMessage(result.error);
        setConfirming(false);
        toast.success("Certificate generated");
        void navigate(commercialCoaPath(result.data));
        return null;
      }} /> : null}
  </PermissionGuard>;
}
