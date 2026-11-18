import { CertificateSignatures } from "@/shared/ard-view/certificate-signatures";
import type { ArdSignatories } from "../../lib/ard-signatories";

export function ArdSignatures({ signatories }: { signatories: ArdSignatories | undefined }) {
  return <CertificateSignatures signatories={signatories ? { analysts: signatories.analysts, releasedBy: signatories.checker, approvedBy: signatories.approver ?? null } : undefined} />;
}
