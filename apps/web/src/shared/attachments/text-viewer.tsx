import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";

const textLimit = 1024 * 1024;
const rowLimit = 2000;
const columnLimit = 100;

/** RFC 4180 style: quoted fields may hold the delimiter, quotes ("") and line breaks. */
export function parseDelimited(text: string, delimiter: string, maxRows = rowLimit + 1): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length && rows.length < maxRows; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === "\"" && text[index + 1] === "\"") { field += "\""; index += 1; }
      else if (char === "\"") quoted = false;
      else field += char;
    } else if (char === "\"" && field === "") quoted = true;
    else if (char === delimiter) { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += char;
  }
  if ((field || row.length) && rows.length < maxRows) { row.push(field); rows.push(row); }
  return rows;
}
const delimiterFor = (name: string, firstLine: string) => /\.tsv$/i.test(name) || firstLine.includes("\t") ? "\t"
  : (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

function useText(blob: Blob) {
  const [text, setText] = useState<{ value: string; truncated: boolean } | null>(null);
  useEffect(() => {
    let closed = false;
    void blob.slice(0, textLimit).text().then((value) => { if (!closed) setText({ value: value.replace(/^﻿/, ""), truncated: blob.size > textLimit }); });
    return () => { closed = true; };
  }, [blob]);
  return text;
}
const Loading = () => <div role="status" className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"><Spinner />Reading file…</div>;
const Note = ({ children }: { children: React.ReactNode }) => <p className="shrink-0 border-t bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">{children}</p>;

/** Plain text and JSON, shown exactly as stored. JSON is laid out for reading without changing its values. */
export function TextViewer({ blob, json }: { blob: Blob; json: boolean }) {
  const text = useText(blob);
  if (!text) return <Loading />;
  let shown = text.value;
  if (json && !text.truncated) { try { shown = JSON.stringify(JSON.parse(text.value), null, 2); } catch { /* show as stored */ } }
  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
    <pre tabIndex={0} aria-label="File contents" className="min-h-0 flex-1 overflow-auto bg-muted/20 p-3 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{shown || "This file is empty."}</pre>
    {text.truncated ? <Note>Showing the first 1 MB of this file.</Note> : null}
  </div>;
}

/** CSV and TSV as a table. The first row is treated as column headings. */
export function DelimitedViewer({ blob, name }: { blob: Blob; name: string }) {
  const text = useText(blob);
  if (!text) return <Loading />;
  const rows = parseDelimited(text.value, delimiterFor(name, text.value.split(/\r?\n/, 1)[0] ?? ""));
  if (!rows.length) return <TextViewer blob={blob} json={false} />;
  const [head = [], ...body] = rows;
  const width = Math.min(columnLimit, Math.max(...rows.map((row) => row.length)));
  const shown = body.slice(0, rowLimit);
  const notes = [text.truncated || body.length > rowLimit ? `Showing the first ${shown.length.toLocaleString("en-US")} rows.` : null,
    rows.some((row) => row.length > columnLimit) ? `Showing the first ${columnLimit} columns.` : null].filter(Boolean);
  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
    <div className="min-h-0 flex-1 overflow-auto">
      <Table aria-label={`Contents of ${name}`}>
        <TableHeader className="sticky top-0 z-10 bg-muted"><TableRow>
          <TableHead className="w-12 text-right text-muted-foreground">#</TableHead>
          {Array.from({ length: width }, (_, column) => <TableHead key={column} className="whitespace-nowrap">{head[column] ?? ""}</TableHead>)}
        </TableRow></TableHeader>
        <TableBody>{shown.map((row, index) => <TableRow key={index}>
          <TableCell className="text-right tabular-nums text-muted-foreground">{index + 1}</TableCell>
          {Array.from({ length: width }, (_, column) => <TableCell key={column} className="max-w-80 truncate tabular-nums" title={row[column]}>{row[column] ?? ""}</TableCell>)}
        </TableRow>)}</TableBody>
      </Table>
    </div>
    {notes.length ? <Note>{notes.join(" ")}</Note> : null}
  </div>;
}
