import type { ArdSignatories } from "../../lib/ard-signatories";

/** Recorded identities accompany the manual signature lines; printing does not sign or approve the certificate. */
export function ArdSignatures({ signatories }: { signatories: ArdSignatories | undefined }) {
  return <div className="print-signatures">
    <div><span aria-hidden="true" />Analysed by<p>{signatories?.analysts.join(", ") || "Not recorded"}</p></div>
    <div><span aria-hidden="true" />Checked by<p>{signatories?.checker || "Not recorded"}</p></div>
    <div><span aria-hidden="true" />Approved by</div>
  </div>;
}
