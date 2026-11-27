import { useMemo, useState } from "react";
import { Link2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmActionDialog, TableMenu } from "@/shared/actions";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { RichTextView, richTextToPlain } from "@/shared/rich-text/rich-text-view";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { linksSchema, type StpTestLinks } from "./stp-content";
import { specificationLinkKeys, stpRevisionAudit } from "./stp-keys";
import { useMaterialSpecStpLinksQuery, useProductSpecStpLinksQuery, useSaveMaterialSpecStpLinkMutation, useSaveProductSpecStpLinkMutation } from "./stp-revision-api";

export interface LinkedSpecification { kind: "material" | "product"; id: string }
type Test = StpTestLinks["tests"][number];
/** Specification test names are saved as rich text; menus and dialog titles need them as one line. */
const testName = (test: Test, fallback: string) => richTextToPlain(test.sectionName) || fallback;

function useLinks(specification: LinkedSpecification) {
  const material = useMaterialSpecStpLinksQuery({ ...stpRevisionAudit, materialSpecificationId: specification.id }, { skip: specification.kind !== "material" });
  const product = useProductSpecStpLinksQuery({ ...stpRevisionAudit, productSpecificationId: specification.id }, { skip: specification.kind !== "product" });
  const query = specification.kind === "material" ? material : product;
  const parsed = useMemo(() => query.data ? linksSchema.safeParse(query.data) : null, [query.data]);
  const [saveMaterial] = useSaveMaterialSpecStpLinkMutation();
  const [saveProduct] = useSaveProductSpecStpLinkMutation();
  const save = async (formSectionId: string, stpNumber: string | null, testKey: string | null) => {
    const body = { domainEntitiesStpRevisionsSaveStpTestLinkRequest: { stpNumber, testKey } };
    const result = specification.kind === "material"
      ? await saveMaterial({ ...stpRevisionAudit, materialSpecificationId: specification.id, formSectionId, ...body })
      : await saveProduct({ ...stpRevisionAudit, productSpecificationId: specification.id, formSectionId, ...body });
    return "error" in result ? apiErrorMessage(result.error) : null;
  };
  return { query, links: parsed?.success ? parsed.data : null, unreadable: parsed?.success === false, save };
}

const cited = (test: Test) => test.testKey
  ? <span className="flex flex-wrap items-center gap-1">{test.stpNumber} · {test.resolved ? `${test.testNumber ?? ""} ${test.testTitle ?? ""}`.trim() : test.testKey}
    {test.resolved ? <span className="text-xs text-muted-foreground">(rev. {test.revisionNumber})</span> : <Badge variant="destructive">Not in the approved revision</Badge>}</span>
  : <span className="text-muted-foreground">Not cited</span>;

/** Each specification test and the STP test it is performed by, with the specification's view and edit keys. */
export function StpTestLinksPanel({ specification }: { specification: LinkedSpecification }) {
  const { query, links, unreadable, save } = useLinks(specification);
  const [editing, setEditing] = useState<Test | null>(null);
  const [clearing, setClearing] = useState<Test | null>(null);
  if (query.isLoading) return <Skeleton className="h-24 w-full" />;
  if (query.error || unreadable || !links) return <section aria-label="STP tests" className="rounded-lg border p-4">
    <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The STP links could not be read."}</p></section>;
  const keys = specificationLinkKeys(links.kind);
  return <section aria-label="STP tests" className="space-y-2 rounded-lg border bg-card p-4">
    <div><h2 className="text-sm font-semibold">Performed by STP test</h2>
      <p className="text-xs text-muted-foreground">{links.stpNumbers.length ? `STPs recorded for this item: ${links.stpNumbers.join(", ")}.` : "No STP is recorded for this item; every approved STP of its kind can be cited."}</p></div>
    {links.tests.length === 0 ? <p className="text-sm text-muted-foreground">This specification has no tests.</p>
      : <table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1">Specification test</th><th className="py-1">STP test</th><th className="w-12" /></tr></thead>
        <tbody>{links.tests.map((test) => <tr key={test.formSectionId} className="border-t align-top">
          <td className="py-2 pr-2">{test.sectionName?.trim() ? <RichTextView html={test.sectionName} /> : <span className="text-muted-foreground">Unnamed test</span>}</td><td className="py-2 pr-2">{cited(test)}</td>
          <td className="py-1 text-right"><TableMenu label={`STP test for ${testName(test, "test")}`} items={[
            { id: "cite", label: test.testKey ? "Change STP test" : "Cite STP test", icon: Link2, require: keys.edit, onSelect: () => setEditing(test) },
            ...(test.testKey ? [{ id: "clear", label: "Remove citation", icon: Unlink, destructive: true, require: keys.edit, onSelect: () => setClearing(test) }] : []),
          ]} /></td></tr>)}</tbody></table>}
    {editing ? <CiteDialog test={editing} links={links} editKey={keys.edit} onClose={() => setEditing(null)} save={save} /> : null}
    {clearing ? <ConfirmActionDialog require={keys.edit} title={`Remove the STP test from ${testName(clearing, "this test")}?`}
      description="The specification test will no longer cite an STP test. Its limits and results are not changed." confirmLabel="Remove citation" busyLabel="Removing…"
      onClose={() => setClearing(null)} onConfirm={async () => { const failed = await save(clearing.formSectionId, null, null); if (!failed) toast.success("Citation removed"); return failed; }} /> : null}
  </section>;
}

function CiteDialog({ test, links, editKey, onClose, save }: {
  test: Test; links: StpTestLinks; editKey: string; onClose: () => void; save: (id: string, stp: string | null, key: string | null) => Promise<string | null>;
}) {
  const [choice, setChoice] = useState(test.stpNumber && test.testKey ? `${test.stpNumber}|${test.testKey}` : "");
  const permission = usePermissionAction(editKey);
  return <ConfirmActionDialog require={editKey} destructive={false} title={`STP test for ${testName(test, "this test")}`}
    description="Choose the test of an approved STP revision that this specification test is performed by." confirmLabel="Save" busyLabel="Saving…"
    onClose={onClose} onConfirm={async () => {
      const denied = permission.check();
      if (denied) return denied;
      const [stpNumber, testKey] = choice.split("|");
      if (!stpNumber || !testKey) return "Choose an STP test.";
      const failed = await save(test.formSectionId, stpNumber, testKey);
      if (!failed) toast.success("STP test cited");
      return failed;
    }}>
    {links.options.length === 0 ? <p className="text-sm text-muted-foreground">No approved STP revision of this kind has tests yet.</p>
      : <div className="space-y-1.5"><Label htmlFor="stp-link-choice">STP test</Label>
        <Select value={choice} onValueChange={setChoice}><SelectTrigger id="stp-link-choice" className="w-full"><SelectValue placeholder="Choose a test" /></SelectTrigger>
          <SelectContent>{links.options.map((option) => <SelectItem key={`${option.stpNumber}|${option.testKey}`} value={`${option.stpNumber}|${option.testKey}`}>
            {option.stpNumber} rev. {option.revisionNumber} · {option.testNumber ? `${option.testNumber} ` : ""}{option.testTitle}</SelectItem>)}</SelectContent></Select></div>}
  </ConfirmActionDialog>;
}
