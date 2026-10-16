import { useEffect, useMemo, useState } from "react";
import { FunctionSquare, Pencil, Plus, Table2, Trash2, Type } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsHeader } from "@/modules/settings-support/ui";
import { ConfirmActionDialog, DropdownButton, TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { formulaPreview } from "@/shared/formula/formula-preview";
import { ExpressionView } from "@/shared/formula/ui/math/expression-view";
import { QuestionType, questionTypeLabel, FormulaType, type QuestionType as QuestionTypeValue } from "@/shared/questions/question-types";
import { usePageSearch } from "@/shared/search/page-search";
import { useDeleteApiV1FormQuestionByQuestionIdMutation, useGetApiV1FormQuestionQuery } from "../api/questions-api";
import { editRoute, formulaQuestionPath, questionPermissions, questionsAudit, tableQuestionPath, typeFilterOptions } from "../lib/questions";
import { questionRowsSchema, type QuestionRow } from "../schemas/question-schema";
import { QuestionDialog } from "./question-dialog";

const column = dataTableColumns<QuestionRow>();
function Configuration({ row }: { row: QuestionRow }) {
  if (row.type === QuestionType.Formula) { const preview = formulaPreview(row.options[0]); return preview.type === FormulaType.Uniformity ? <Badge variant="secondary">Uniformity of weight</Badge>
    : preview.expression ? <div className="max-w-md rounded-md border px-2 py-1"><ExpressionView expression={preview.expression} print className="justify-start text-left text-xs" /></div> : <span className="text-muted-foreground">–</span>; }
  if (row.type === QuestionType.Table) return <Badge variant="secondary">Table</Badge>;
  return <div className="flex flex-wrap gap-1.5">{row.isMultiSelect ? <Badge variant="secondary">Multiple answers</Badge> : null}
    {row.options.length ? <Badge variant="outline">{row.options.length} {row.options.length === 1 ? "option" : "options"}</Badge> : null}</div>;
}

/** Every reusable question: standard questions open in a dialog, formula and table questions on their own pages. */
export function QuestionsPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState("all");
  const search = usePageSearch("questions", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${type}` });
  const query = useGetApiV1FormQuestionQuery({ ...questionsAudit, page: table.page, pageSize: table.pageSize, searchQuery: search, ...(type === "all" ? {} : { type: [Number(type) as QuestionTypeValue] }) });
  const parsed = useMemo(() => query.data ? questionRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const [editing, setEditing] = useState<QuestionRow | "new" | null>(null);
  const [removing, setRemoving] = useState<QuestionRow | null>(null);
  const [remove] = useDeleteApiV1FormQuestionByQuestionIdMutation();
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const columns = useMemo(() => { const open = (row: QuestionRow) => { const route = editRoute(row.type, row.id); if (route) void navigate(route); else setEditing(row); };
    return column.columns([
    column.accessor("label", { header: "Question", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.label}</div>
      {row.original.reference ? <div className="text-xs text-muted-foreground">Ref: {row.original.reference}</div> : null}</div> }),
    column.accessor((row) => questionTypeLabel(row.type), { id: "type", header: "Type", size: 140, cell: ({ getValue }) => <Badge variant="outline">{getValue()}</Badge> }),
    column.display({ id: "configuration", header: "Configuration", cell: ({ row }) => <Configuration row={row.original} /> }),
    column.accessor((row) => row.createdAt ?? "", { id: "created", header: "Created", size: 130, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.label}`} items={[
      { id: "edit", label: "Edit", icon: Pencil, require: questionPermissions.edit, onSelect: () => open(row.original) },
      { id: "remove", label: "Delete", icon: Trash2, destructive: true, separated: true, require: questionPermissions.remove, onSelect: () => setRemoving(row.original) },
    ]} /> }),
  ]); }, [navigate]);
  return <section className="page-fill">
    <SettingsHeader title="Questions" description="Reusable test questions, formulas and table questions for form templates.">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={type} onValueChange={setType}><SelectTrigger aria-label="Question type" className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{typeFilterOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
        <DropdownButton label="Add question" icon={Plus} items={[
          { id: "standard", label: "Question", icon: Type, require: questionPermissions.create, onSelect: () => setEditing("new") },
          { id: "formula", label: "Formula question", icon: FunctionSquare, require: questionPermissions.create, to: formulaQuestionPath(null) },
          { id: "table", label: "Table question", icon: Table2, require: questionPermissions.create, to: tableQuestionPath(null) },
        ]} />
      </div>
    </SettingsHeader>
    <ServerDataTable label="Questions" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned questions the app could not read." : null}
      emptyTitle={search.trim() || type !== "all" ? "No questions match" : "No questions yet"} emptyDescription={search.trim() ? "Search by question, description or reference." : "Add the first question."} />
    {editing ? <QuestionDialog question={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
    {removing ? <ConfirmActionDialog require={questionPermissions.remove} title={`Delete ${removing.label}?`} description="Templates that already use this question keep their copy of it. This cannot be undone."
      confirmLabel="Delete question" busyLabel="Deleting…" onClose={() => setRemoving(null)}
      onConfirm={async () => { const result = await remove({ ...questionsAudit, questionId: removing.id }); if ("error" in result) return apiErrorMessage(result.error); setRemoving(null); return null; }} /> : null}
  </section>;
}
