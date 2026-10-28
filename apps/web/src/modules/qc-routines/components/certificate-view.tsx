import { CertificateResult } from "./certificate-result";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { useState } from "react";
import { Droplets, Printer } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import type { PageCrumb } from "@/shared/navigation/page-breadcrumbs";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { analysisLabel, certificateRows, routinePermissions, waterPath, type Certificate } from "../lib/routines";

const cell = "border px-2 py-1.5 align-top text-sm";

/** The certificate as issued: a fixed copy of the approved, reportable results. */
function CertificateSheet({ certificate, heading, subtitle, showPoint }: { certificate: Certificate; heading: string; subtitle: string; showPoint: boolean }) {
  const rows = certificateRows(certificate.rowsJson);
  return <div className="space-y-4 bg-white p-4 text-black">
    <header className="text-center"><p className="text-sm font-semibold">QUALITY CONTROL DEPARTMENT</p><h2 className="text-lg font-bold uppercase">{heading}</h2>
      <p className="font-medium">{certificate.certificateCode ?? "–"}</p><p className="text-sm">{subtitle}</p></header>
    {rows === null ? <p role="alert" className="text-sm text-red-700">The certificate's results could not be read.</p>
      : rows.length === 0 ? <p className="text-sm">The certificate has no reportable results.</p>
      : <table className="w-full border-collapse"><thead><tr className="bg-neutral-100 text-left text-xs">
        <th className={cell}>Analysis</th>{showPoint ? <th className={cell}>Point / area</th> : null}<th className={cell}>Test</th><th className={cell}>Specification</th><th className={cell}>Result</th><th className={cell}>Reference</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.key}><td className={cell}>{analysisLabel(row.analysisType)}{row.group ? <span className="block text-xs">{row.group}</span> : null}</td>
          {showPoint ? <td className={cell}>{row.sampleIdentity ?? "–"}</td> : null}<td className={cell}><RichTextView html={row.label} /></td><td className={cell}><RichTextView html={row.specification || "–"} /></td>
          <td className={cell}><CertificateResult value={row.result} unit={row.unit} /></td><td className={cell}>{row.reference || "–"}</td></tr>)}</tbody></table>}
    <p className="text-xs">Issued {formatDateTime(certificate.issuedAt) ?? "–"}. This certificate is a fixed copy of the approved reportable results.</p>
  </div>;
}

export function CertificatePage({ query, crumbs, heading, subtitle, showPoint, coverage }: {
  query: { data?: Certificate | undefined; isLoading: boolean; error?: Parameters<typeof apiErrorMessage>[0]; refetch: () => unknown };
  crumbs: (certificate: Certificate) => readonly PageCrumb[]; heading: (certificate: Certificate) => string; subtitle: (certificate: Certificate) => string; showPoint: boolean;
  /** Offer to start water coverage from a combined water certificate. */ coverage?: boolean;
}) {
  const [printing, setPrinting] = useState(false);
  if (query.isLoading) return <DetailPageSkeleton label="Loading certificate" />;
  const certificate = query.data;
  if (!certificate) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h1 className="text-lg font-semibold">Certificate unavailable</h1>
    <p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The certificate could not be found."}</p><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>;
  const sheet = <CertificateSheet certificate={certificate} heading={heading(certificate)} subtitle={subtitle(certificate)} showPoint={showPoint} />;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={certificate.certificateCode ?? "Certificate"} crumbs={crumbs(certificate)} actions={<>
      {coverage && certificate.combined ? <PermissionGuard require={routinePermissions.waterManage}><Button asChild variant="outline"><Link to={`${waterPath}?certificateId=${certificate.id}`}><Droplets />Activate water coverage</Link></Button></PermissionGuard> : null}
      <Button variant="outline" onClick={() => setPrinting(true)}><Printer />Print</Button></>} />
    <div className="overflow-x-auto rounded-lg border">{sheet}</div>
    {printing ? <PrintPreviewDialog title={heading(certificate)} onClose={() => setPrinting(false)}>{sheet}</PrintPreviewDialog> : null}
  </article>;
}
