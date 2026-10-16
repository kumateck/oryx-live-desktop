import { useState } from "react";
import { TableGrid } from "./table-grid";
import { answerGrid, parseTableAnswer, parseTableConfig, tableAnswerFilled, type TableAnswer } from "./table-question";
import { useEquipmentOptions } from "./use-equipment-options";

/** An analyst filling in a table question. The answer is reported as the stored JSON cell map. */
export function TableAnswerInput({ definition, value, onChange, disabled = false }: { definition: string; value: string | null; onChange: (value: string | null) => void; disabled?: boolean }) {
  const config = parseTableConfig(definition);
  const loadEquipment = useEquipmentOptions();
  const [labels, setLabels] = useState<Record<string, string>>({});
  const answer = parseTableAnswer(value);
  if (!config) return <p className="text-sm text-destructive">This table question has no valid table. Ask for the question to be fixed in Settings → Questions.</p>;
  return <TableGrid config={config} mode="answer" answer={answer} labels={labels} loadEquipment={loadEquipment} disabled={disabled}
    onAnswer={(key, entry, label) => { const next: TableAnswer = { ...answer, [key]: entry }; onChange(tableAnswerFilled(next) ? JSON.stringify(next) : null); if (label !== undefined) setLabels({ ...labels, [key]: label }); }} />;
}

/** A recorded table answer, as headed rows of the cells that were filled in. */
export function TableAnswerView({ definition, value }: { definition: string | null; value: string | null }) {
  const grid = answerGrid(parseTableConfig(definition), parseTableAnswer(value));
  if (grid.rows.length === 0) return <span className="text-sm text-muted-foreground">–</span>;
  return <div className="max-w-full overflow-x-auto"><table className="w-full min-w-80 border-collapse text-sm">
    <thead><tr className="bg-muted/50">{grid.headers.map((header, index) => <th key={`${header}-${index}`} className="border px-3 py-2 text-center font-semibold">{header}</th>)}</tr></thead>
    <tbody>{grid.rows.map((row, index) => <tr key={index}>{row.map((cell, col) => <td key={col} className="border px-3 py-2">{cell || "–"}</td>)}</tr>)}</tbody>
  </table></div>;
}
