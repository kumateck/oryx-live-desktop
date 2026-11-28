import { formatDate, formatMonthYear } from "@/shared/format/dates";
import type { CertificateHeader, CertificatePerson } from "../lib/certificate-header";

const cell = "border border-black px-2 py-1 align-top text-sm";
const label = `${cell} font-semibold whitespace-nowrap`;

/** What was tested: batch and its dates, the AR number, sampling and analysis dates, and for a product its composition, pack and shelf life. */
export function CertificateFacts({ header }: { header: CertificateHeader }) {
  const product = header.subject === "Product";
  return <div className="space-y-2">
    <table className="w-full border-collapse" aria-label="Certificate details"><tbody>
      <tr><td className={label}>Batch No.: <span className="font-normal">{header.batchNumber ?? "–"}</span></td>
        <td className={`${cell} text-center text-base font-bold uppercase`} rowSpan={2}>{header.name ?? "–"}{header.code ? <span className="block text-xs font-normal normal-case">{header.code}</span> : null}</td>
        <td className={label}>Sampled Date: <span className="font-normal">{formatDate(header.sampledAt) ?? "–"}</span></td></tr>
      <tr><td className={label}>Mfg Date: <span className="font-normal">{formatMonthYear(header.manufacturingDate) ?? "–"}</span></td>
        <td className={label}>Analysed Date: <span className="font-normal">{formatDate(header.analysedAt) ?? "–"}</span></td></tr>
      <tr><td className={label}>Exp Date: <span className="font-normal">{formatMonthYear(header.expiryDate) ?? "–"}</span></td>
        <td className={`${cell} text-center`} colSpan={2}><span className="font-semibold">QC AR No.: </span>{header.arNumber ?? "–"}</td></tr>
    </tbody></table>
    {product && (header.composition || header.packStyle || header.shelfLife) ? <table className="w-full border-collapse" aria-label="Product details"><tbody>
      {header.composition ? <tr><th scope="row" className={`${label} w-40 text-left`}>Composition</th><td className={`${cell} whitespace-pre-wrap`}>{header.composition}</td></tr> : null}
      {header.packStyle ? <tr><th scope="row" className={`${label} w-40 text-left`}>Pack Style</th><td className={`${cell} whitespace-pre-wrap`}>{header.packStyle}</td></tr> : null}
      {header.shelfLife ? <tr><th scope="row" className={`${label} w-40 text-left`}>Shelf Life</th><td className={cell}>{header.shelfLife}</td></tr> : null}
    </tbody></table> : null}
  </div>;
}

const names = (people: readonly CertificatePerson[]) => people.map((person) => person.name).join(", ") || "–";
const designations = (people: readonly CertificatePerson[]) => people.map((person) => person.designation).filter(Boolean).join(", ") || "–";

/** Who analysed, checked and approved the certificate, with space to sign and date the printed copy. */
export function CertificateSignatureTable({ header }: { header: CertificateHeader }) {
  const columns = [header.analysedBy, header.checkedBy, header.approvedBy];
  return <table className="w-full border-collapse" aria-label="Certificate signatures"><thead><tr>
    <th className={cell} aria-label="Field" />
    {["Analysed by", "Checked by", "Approved by"].map((title) => <th key={title} scope="col" className={`${cell} uppercase`}>{title}</th>)}</tr></thead>
    <tbody>
      <tr><th scope="row" className={`${label} text-left`}>Signature</th>{columns.map((_, index) => <td key={index} className={`${cell} h-10`} />)}</tr>
      <tr><th scope="row" className={`${label} text-left`}>Name</th>{columns.map((people, index) => <td key={index} className={cell}>{names(people)}</td>)}</tr>
      <tr><th scope="row" className={`${label} text-left`}>Designation</th>{columns.map((people, index) => <td key={index} className={cell}>{designations(people)}</td>)}</tr>
      <tr><th scope="row" className={`${label} text-left`}>Date</th>{columns.map((_, index) => <td key={index} className={`${cell} h-8`} />)}</tr>
    </tbody></table>;
}
