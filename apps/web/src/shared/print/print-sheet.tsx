import type { ReactNode } from "react";
import { signaturePath } from "@/shared/images/signature-path";
import { company } from "./company";

/** The top of a printed document: the company on the left, the document's name and reference on the right. */
export function PrintHeader({ title, reference, aside }: { title: string; reference?: string | null | undefined; aside?: ReactNode }) {
  return <header className="print-header">
    <div className="print-company">
      <img src={company.logoUrl} alt="" />
      <div><strong>{company.name}</strong><span>{company.address}</span><span>{company.phone}</span><span>{company.email} · {company.website}</span></div>
    </div>
    <div className="print-title"><h1>{title}</h1>{reference ? <p>{reference}</p> : null}{aside}</div>
  </header>;
}

/** Labelled values, laid out in columns. Entries without a value are left out. */
export function PrintFacts({ facts }: { facts: readonly { label: string; value: ReactNode }[] }) {
  const shown = facts.filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== "");
  if (shown.length === 0) return null;
  return <dl className="print-facts">{shown.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>;
}

export interface PrintColumn<TRow> { id: string; header: string; cell: (row: TRow, index: number) => ReactNode; align?: "right"; width?: string }

/** A table that repeats its header on every printed page and never splits a row across pages. */
export function PrintTable<TRow>({ caption, columns, rows, rowKey, empty, footer, rowHeightMm, repeatedTitle }: {
  caption?: string; columns: readonly PrintColumn<TRow>[]; rows: readonly TRow[]; rowKey: (row: TRow, index: number) => string; empty: string; footer?: ReactNode; rowHeightMm?: number | undefined; repeatedTitle?: string | undefined;
}) {
  return <table className="print-table">
    {caption ? <caption>{caption}</caption> : null}
    <thead>{repeatedTitle ? <tr><th colSpan={columns.length}>{repeatedTitle}</th></tr> : null}<tr>{columns.map((column) => <th key={column.id} scope="col" style={{ textAlign: column.align ?? "left", width: column.width }}>{column.header}</th>)}</tr></thead>
    <tbody>{rows.length === 0 ? <tr><td colSpan={columns.length} className="print-empty">{empty}</td></tr>
      : rows.map((row, index) => <tr key={rowKey(row, index)} style={rowHeightMm ? { height: `${rowHeightMm}mm` } : undefined}>{columns.map((column) => <td key={column.id} style={{ textAlign: column.align ?? "left" }}>{column.cell(row, index)}</td>)}</tr>)}</tbody>
    {footer ? <tfoot>{footer}</tfoot> : null}
  </table>;
}

/** A signature line: who signs it and, once they have, their name, stored signature and when. */
export interface PrintSigner { role: string; name?: string | null; signature?: string | null; signedOn?: string | null; note?: string | null }

/**
 * Lines to sign on. A line given only its role stays blank for a signature by hand; a line given a
 * person shows their stored signature above the line and their full name below it.
 */
export function PrintSignatures({ roles, signers }: { roles?: readonly string[]; signers?: readonly PrintSigner[] }) {
  const lines: readonly PrintSigner[] = signers ?? (roles ?? []).map((role) => ({ role }));
  return <div className="print-signatures">{lines.map((line) => {
    const image = signaturePath(line.signature);
    return <div key={line.role}>
      {image ? <img className="print-signature-image" src={image} alt={`Signature of ${line.name ?? line.role}`} /> : null}
      <span className={image ? "print-signature-line signed" : "print-signature-line"} />
      <div>{line.role}</div>
      {line.name ? <strong className="print-signer-name">{line.name}</strong> : null}
      {line.signedOn ? <div className="print-signer-note">{line.signedOn}</div> : null}
      {line.note ? <div className="print-signer-note">{line.note}</div> : null}
    </div>;
  })}</div>;
}
