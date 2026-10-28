import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { PermissionRequirement } from "@/shared/auth/access";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatDate } from "@/shared/format/dates";
import type { PageCrumb } from "@/shared/navigation/page-breadcrumbs";
import { PageHeader } from "@/shared/navigation/page-header";
import { specificationReferences } from "@/shared/questions/question-types";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import type { Specification, SpecificationSection } from "./specification-schema";

const cell = "border-b px-3 py-2 align-top text-sm";
const known = new Set<string>(specificationReferences.map((item) => item.value));

/** The reference each test is assessed against, every test required, sent together. */
export function SpecificationCompletion({ specification, sections, item, crumbs, require, cancelTo, onSubmit }: {
  specification: Specification; sections: readonly SpecificationSection[]; item: string | null; crumbs: readonly PageCrumb[];
  require: PermissionRequirement; cancelTo: string;
  /** Sends every test's value; resolves to an error message, or null when saved. */ onSubmit: (values: { formSectionId: string; value: string }[]) => Promise<string | null>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(sections.flatMap((section) => section.value && known.has(section.value) ? [[section.id, section.value]] : [])));
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const permission = usePermissionAction(require);
  const missing = sections.filter((section) => !values[section.id]).length;
  const submit = async () => {
    setTried(true);
    if (sections.length === 0 || missing > 0) return;
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    setSaving(true);
    setMessage("");
    const error = await onSubmit(sections.map((section) => ({ formSectionId: section.id, value: values[section.id] ?? "" })));
    setSaving(false);
    if (error) setMessage(error);
  };
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Complete ${specification.number}`} crumbs={crumbs} actions={<PermissionGuard require={require}>
      <Button asChild variant="outline"><Link to={cancelTo}>Cancel</Link></Button>
      <Button type="button" disabled={saving || sections.length === 0} onClick={() => void submit()}>{saving ? <><Spinner />Saving…</> : "Save specification"}</Button></PermissionGuard>} />
    <KeyFacts>
      <KeyFact label="For" value={item ?? "–"} />
      <KeyFact label="Template" value={specification.form?.name ?? "–"} />
      <KeyFact label="Revision" value={specification.revisionNumber ?? "–"} />
      <KeyFact label="Effective" value={formatDate(specification.effectiveDate) ?? "–"} />
      <KeyFact label="Tests" value={sections.length} note={missing > 0 ? `${String(missing)} without a reference` : "All set"} />
    </KeyFacts>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    {tried && missing > 0 ? <p role="alert" className="text-sm text-destructive">Choose a reference for every test.</p> : null}
    {sections.length === 0 ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">The template has no tests, so there is nothing to complete. Add tests to the template first.</p>
      : <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full min-w-[40rem] table-fixed border-collapse">
        <thead className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground"><tr>
          <th className="w-12 border-b px-3 py-2">No.</th><th className="w-[30%] border-b px-3 py-2">Test</th><th className="border-b px-3 py-2">Specification</th><th className="w-48 border-b px-3 py-2">Reference</th>
        </tr></thead>
        <tbody>{sections.map((section, index) => {
          const invalid = tried && !values[section.id];
          return <tr key={section.id}><td className={cell}>{index + 1}</td><td className={cell}><RichTextView html={section.name} /></td><td className={cell}><RichTextView html={section.description} /></td>
            <td className={cell}><Select value={values[section.id] ?? ""} onValueChange={(value) => setValues((current) => ({ ...current, [section.id]: value }))}>
              <SelectTrigger aria-label={`Reference for test ${String(index + 1)}`} aria-invalid={invalid} className="w-full"><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>{specificationReferences.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></td></tr>;
        })}</tbody>
      </table></div>}
  </article>;
}
