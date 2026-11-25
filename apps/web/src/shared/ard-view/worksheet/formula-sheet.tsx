import ExpressionView from "@/shared/formula/ui/math/expression-view";
import type { FormulaWorksheet, ReadingsTable, WorksheetEntry } from "./formula-model";

const heading = "text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground";
const cell = "border border-border px-2 py-1 align-top";

/** A value as recorded, or a writing line on the blank worksheet. */
function Recorded({ value, blank }: { value: string; blank: boolean }) {
  if (blank) return <span aria-hidden className="block h-5 min-w-24 border-b border-border" />;
  return value.trim() ? <span className="tabular-nums">{value}</span> : <span className="text-muted-foreground">—</span>;
}

/** Labelled values in a bordered two-column grid: Claim | 120. */
export function EntryGrid({ title, entries, blank }: { title: string; entries: readonly WorksheetEntry[]; blank: boolean }) {
  if (!entries.length) return null;
  return <div className="min-w-0 break-inside-avoid">
    <p className={`${heading} mb-1`}>{title}</p>
    <table className="w-full table-fixed border-collapse text-sm"><tbody>
      {entries.map((entry) => <tr key={entry.key}>
        <th scope="row" className={`${cell} w-3/5 bg-muted/50 text-left font-medium`}>
          {entry.label}{entry.label !== entry.key ? <span className="ml-1 font-normal text-muted-foreground">({entry.key})</span> : null}
        </th>
        <td className={cell}><Recorded value={entry.value} blank={blank} /></td>
      </tr>)}
    </tbody></table>
  </div>;
}

function Readings({ table, blank }: { table: ReadingsTable; blank: boolean }) {
  return <div className="min-w-0 break-inside-avoid">
    <p className={`${heading} mb-1`}>Readings</p>
    <div className="max-w-full overflow-x-auto"><table className="w-full border-collapse text-sm">
      <thead><tr className="bg-muted">
        <th scope="col" className={`${cell} text-left font-semibold`}>Reading</th>
        {table.columns.map((column, index) => <th key={`${column}-${index}`} scope="col" className={`${cell} text-right font-semibold`}>{column}</th>)}
      </tr></thead>
      <tbody>{table.rows.map((row, index) => <tr key={`${row.label}-${index}`} className={row.summary ? "bg-muted/50 font-semibold" : undefined}>
        <th scope="row" className={`${cell} text-left ${row.summary ? "font-semibold" : "font-normal"}`}>{row.label}</th>
        {row.cells.map((value, column) => <td key={column} className={`${cell} h-7 text-right tabular-nums`}>{blank ? "" : value || "—"}</td>)}
      </tr>)}</tbody>
    </table></div>
  </div>;
}

/**
 * A formula question as an analytical worksheet: the recorded constants, variables and inputs, the readings table,
 * the formula typeset and centred, each sample's calculation with its values substituted, then the result.
 */
export function FormulaSheet({ view, title }: { view: FormulaWorksheet; title?: string | undefined }) {
  const { blank } = view;
  const averages = view.results.filter(result => /^(average|mean)(?:[ _-]+(?:content|result|assay))?$/i.test(result.label.trim()));
  const results = averages.length ? averages : view.results;
  const calculations = averages.length ? [] : view.calculations;
  const inputs = [
    { title: "Constants", entries: view.constants },
    { title: "Recorded variables", entries: view.variables },
    { title: "Standard inputs", entries: view.standardInputs },
    ...view.samples.map((sample) => ({ title: `${sample.label} inputs`, entries: sample.entries })),
  ].filter((group) => group.entries.length > 0);
  return <section aria-label={title ? `Calculation: ${title}` : "Calculation"} className="space-y-3 text-sm">
    {inputs.length ? <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
      {inputs.map((group) => <EntryGrid key={group.title} title={group.title} entries={group.entries} blank={blank} />)}
    </div> : null}
    {view.table ? <Readings table={view.table} blank={blank} /> : null}
    <div className="break-inside-avoid space-y-2">
      <p className={heading}>Formula</p>
      <ExpressionView print expression={view.expression} option={{ append100: view.percent }} className="justify-center rounded-md border border-border bg-muted/30 py-2 text-base" />
      {calculations.length ? <table className="w-full border-collapse text-sm" aria-label="Calculations"><tbody>
        {calculations.map((calculation, index) => <tr key={`${calculation.label}-${index}`}>
          <th scope="row" className={`${cell} w-28 text-left font-semibold`}>{calculation.label}</th>
          <td className={cell}>{blank
            ? <span aria-hidden className="block h-7 border-b border-dashed border-border" />
            : <div className="flex flex-wrap items-center gap-x-2">
              {calculation.substituted ? <ExpressionView print expression={calculation.substituted} option={{ append100: view.percent, result: calculation.result }} className="justify-start p-0" /> : null}
              {calculation.unavailable ? <span className="text-muted-foreground">Result unavailable</span> : null}
            </div>}</td>
        </tr>)}
      </tbody></table> : null}
    </div>
    {results.length || blank ? <dl className="flex flex-wrap justify-end gap-2 break-inside-avoid" aria-label="Results">
      {(blank ? [{ label: "Result", value: "", primary: true }] : results).map((line) => <div key={line.label}
        className={`flex min-w-40 items-baseline justify-between gap-3 rounded-md border px-3 py-1.5 ${line.primary ? "border-foreground/60 font-semibold" : "border-border"}`}>
        <dt className={averages.length ? "sr-only" : undefined}>{averages.length ? "Result" : line.label}</dt><dd className="tabular-nums">{blank ? <span aria-hidden className="inline-block h-4 w-24 border-b border-border" /> : line.value}</dd>
      </div>)}
    </dl> : null}
    {view.notice ? <p className="text-xs text-muted-foreground">{view.notice}</p> : null}
  </section>;
}
