import { CertificateResult, CertificateSpecification } from "@/modules/qc-routines/components/certificate-result";
import { certificateRows, type Certificate, type CertificateRow } from "@/modules/qc-routines/lib/routines";
import { formatDateTime } from "@/shared/format/dates";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { certificateLayout } from "../lib/certificate-layout";
import { certificateHeader } from "../lib/certificate-header";
import { CertificateFacts, CertificateSignatureTable } from "./certificate-header-blocks";

const cell = "border border-black px-2 py-1.5 align-top text-sm";
const Target = { Material: 0, Product: 1 } as const;

function Cells({ row }: { row: CertificateRow }) {
  return <>
    <td className={cell}><CertificateSpecification value={row.result} original={row.specification} /></td>
    <td className={cell}><CertificateResult value={row.result} unit={row.unit} /></td>
    <td className={cell}>{row.reference || "–"}</td>
  </>;
}

/**
 * The issued certificate of analysis as it is printed: numbered tests with their specification, result and reference,
 * grouped tests and every microbial test as sub-rows under one number, then the conclusion.
 */
export function CommercialCertificateSheet({ certificate }: { certificate: Certificate }) {
  const rows = certificateRows(certificate.rowsJson);
  const entries = rows ? certificateLayout(rows) : [];
  const notes = [...new Set(rows?.flatMap(row => row.notes ? [row.notes] : []) ?? [])];
  const subject = certificate.target === Target.Material ? "Material" : "Product";
  const header = certificateHeader(certificate.headerJson);
  return <div className="space-y-4 bg-white p-4 text-black">
    <header className="text-center"><p className="text-sm font-semibold">QUALITY CONTROL DEPARTMENT</p>
      <h2 className="text-lg font-bold uppercase">{subject === "Product" ? "Finished product certificate" : "Material certificate of analysis"}</h2>
      <p className="font-medium">{certificate.certificateCode ?? "–"}</p></header>
    {header ? <CertificateFacts header={header} /> : null}
    {rows === null ? <p role="alert" className="text-sm text-red-700">The certificate's results could not be read.</p>
      : entries.length === 0 ? <p className="text-sm">The certificate has no reportable results.</p>
      : <table className="w-full border-collapse" aria-label="Certificate results"><thead><tr className="bg-neutral-100 text-left text-xs uppercase">
        {["No.", "Test", "Specification", "Result", "Reference"].map(head => <th key={head} scope="col" className={cell}>{head}</th>)}</tr></thead>
        <tbody>{entries.flatMap((entry) => entry.row
          ? [<tr key={entry.row.key}><td className={cell}>{entry.number}.</td><td className={`${cell} font-medium`}><RichTextView html={entry.label} /></td><Cells row={entry.row} /></tr>]
          : [<tr key={`group-${entry.number}`}><td className={cell}>{entry.number}.</td><td className={`${cell} font-medium`} colSpan={4}><RichTextView html={entry.label} /></td></tr>,
            ...entry.lines.map((line) => <tr key={line.key}><td className={cell} aria-hidden /><td className={`${cell} pl-5`}><RichTextView html={line.label} /></td><Cells row={line} /></tr>)])}
        </tbody></table>}
    {entries.length ? <p className="font-semibold">CONCLUSION: <span className="font-normal">{subject} complies with specification.</span></p> : null}
    {header ? <CertificateSignatureTable header={header} /> : null}
    {notes.length ? <section className="space-y-1"><h3 className="font-semibold">Certificate notes</h3>
      {notes.map(note => <p key={note} className="whitespace-pre-wrap break-words">{note}</p>)}</section> : null}
    <p className="text-xs">Issued {formatDateTime(certificate.issuedAt) ?? "–"}. This certificate is a fixed copy of the approved reportable results.</p>
  </div>;
}
