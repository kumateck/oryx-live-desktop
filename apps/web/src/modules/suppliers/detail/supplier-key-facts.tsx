import { KeyFact as Fact, KeyFacts } from "@/shared/detail/key-facts";
import { daysUntil, dueState, dueText } from "@/shared/format/due-dates";
import { formatDate } from "@/shared/format/dates";
import { Skeleton } from "@/shared/skeleton/skeleton";
import type { CertificateSummary } from "./supplier-overview";

export interface KeyFactsProps {
  statusLabel: string;
  approvedAt: string | null | undefined;
  requalificationDueDate: string | null | undefined;
  /** Null while loading. */
  materials: { count: number; manufacturers: number } | null;
  /** Undefined when the user may not read certificates; null while loading. */
  certificates?: CertificateSummary | null;
  /** Undefined when the user may not read performance; null while loading or when never scored. */
  score?: { value: number; period: string | null } | null;
  scoreLoading?: boolean;
}

/** The handful of figures that say whether this supplier can be bought from today. */
export function SupplierKeyFacts({ statusLabel, approvedAt, requalificationDueDate, materials, certificates, score, scoreLoading }: KeyFactsProps) {
  const requalification = daysUntil(requalificationDueDate);
  const loading = <Skeleton className="h-6 w-20" />;
  return <KeyFacts>
    <Fact label="Qualification" value={statusLabel} note={approvedAt ? `Approved ${formatDate(approvedAt) ?? ""}` : "Not approved"} />
    <Fact label="Requalification due" state={dueState(requalification)} value={formatDate(requalificationDueDate) ?? "Not set"}
      note={requalification === null ? "Set when the supplier is approved" : dueText(requalification)} />
    <Fact label="Materials supplied" value={materials ? materials.count : loading}
      note={materials ? `from ${materials.manufacturers} ${materials.manufacturers === 1 ? "manufacturer" : "manufacturers"}` : undefined} />
    {certificates !== undefined ? <Fact label="Certificates" state={certificates?.expired ? "overdue" : certificates?.expiring ? "soon" : "none"}
      value={certificates ? `${certificates.valid + certificates.expiring} valid` : loading}
      note={certificates ? [certificates.expiring ? `${certificates.expiring} expiring soon` : "", certificates.expired ? `${certificates.expired} expired` : ""].filter(Boolean).join(" · ")
        || (certificates.nextExpiry ? `Next expiry ${formatDate(certificates.nextExpiry) ?? ""}` : "None recorded") : undefined} /> : null}
    {score !== undefined ? <Fact label="Latest score" value={scoreLoading ? loading : score ? score.value.toFixed(1) : "Not scored"}
      note={score?.period ?? (scoreLoading ? undefined : "No scorecard saved yet")} /> : null}
  </KeyFacts>;
}
