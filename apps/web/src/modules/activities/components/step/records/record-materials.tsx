import { useMemo } from "react";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";

export interface EvidenceMaterial {
  id: string;
  name: string;
  code: string | null | undefined;
  values: Record<string, string | null>;
}
export interface EvidenceField { key: string; label: string; numeric?: boolean; size?: number }
const column = dataTableColumns<EvidenceMaterial>();
/** One column per recorded field so materials can be compared down the table; the table scrolls sideways when narrow. */
export function RecordMaterials({ label, rows, fields }: { label: string; rows: readonly EvidenceMaterial[]; fields: readonly EvidenceField[] }) {
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Material", size: 220, cell: ({ row }) => <div className="min-w-0 whitespace-normal break-words">
      <p className="font-medium">{row.original.name}</p>{row.original.code ? <p className="text-muted-foreground">{row.original.code}</p> : null}
    </div> }),
    ...fields.map((field) => column.accessor((row) => row.values[field.key] ?? null, {
      id: field.key, size: field.size ?? (field.numeric ? 110 : 160),
      header: () => <div className={field.numeric ? "text-right" : undefined}>{field.label}</div>,
      cell: ({ getValue }) => {
        const value = getValue();
        return <div className={field.numeric ? "text-right tabular-nums" : "min-w-0 whitespace-normal break-words"}>
          {value ?? <span className="text-muted-foreground">–</span>}</div>;
      },
    })),
  ]), [fields]);
  return rows.length ? <ListDataTable label={label} columns={columns} rows={rows} getRowId={(row) => row.id} /> : null;
}
