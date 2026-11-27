import { useState } from "react";
import { FileUp, FileText } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { PageCrumb } from "@/shared/navigation/page-breadcrumbs";
import { PageHeader } from "@/shared/navigation/page-header";
import { proposalSchema, type ImportProposal } from "./stp-content";
import { stpRevisionAudit, stpRevisionKeys, type StpKind, type StpRoutesFor } from "./stp-keys";
import { proposalFlags, StpProposalView } from "./stp-proposal-view";
import { useImportStpDocumentMutation, useImportStpRevisionFileMutation } from "./stp-revision-api";
import { useApplyProposal } from "./use-apply-proposal";

const applyLabel = { create: "Create draft from this", "replace-draft": "Replace the open draft's content", revise: "Start a new revision with this" } as const;

/**
 * Reads a Word STP (an upload, or with `?from=` the STP record's current document version) into a proposal and shows it
 * beside the values to check. Nothing is saved until the person applies it to the STP number.
 */
export function StpImportPage({ kind, routes, crumbs }: { kind: StpKind; routes: StpRoutesFor; crumbs: readonly PageCrumb[] }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const stpNumber = params.get("stp")?.trim() ?? "";
  const from = params.get("from");
  const keys = stpRevisionKeys(kind);
  const permission = usePermissionAction(keys.import);
  const [file, setFile] = useState<File | null>(null);
  const [proposal, setProposal] = useState<ImportProposal | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [readFile] = useImportStpRevisionFileMutation();
  const [readDocument] = useImportStpDocumentMutation();
  const applying = useApplyProposal(kind, stpNumber);
  const heading = [...crumbs, ...(stpNumber ? [{ label: stpNumber, to: routes(kind).list(stpNumber) }] : []), { label: "Import Word STP" }];
  if (!stpNumber) return <article className="space-y-4"><PageHeader title="Import Word STP" crumbs={heading} /><p role="alert" className="text-sm text-destructive">Open this page from an STP number.</p></article>;

  const read = async (source: "file" | "document") => {
    setMessage(null);
    const denied = permission.check();
    if (denied) return setMessage(denied);
    if (source === "file" && !file) return setMessage("Choose a .docx file.");
    setBusy(true);
    const result = source === "file" && file ? await readFile({ kind, file })
      : await readDocument({ ...stpRevisionAudit, domainEntitiesStpRevisionsImportStpDocumentRequest: { kind, stpId: from ?? "" } });
    setBusy(false);
    if ("error" in result) return setMessage(apiErrorMessage(result.error));
    const parsed = proposalSchema.safeParse(result.data);
    if (!parsed.success) return setMessage("The server returned a proposal the app could not read.");
    setProposal(parsed.data);
    if (!parsed.data.succeeded) setMessage(parsed.data.failureReason ?? "The file could not be read as an STP.");
  };
  const apply = async () => {
    if (!proposal) return;
    setBusy(true);
    const result = await applying.apply(proposal);
    setBusy(false);
    if ("error" in result) return setMessage(result.error);
    toast.success("Draft saved from the import");
    void navigate(routes(kind).draft(result.id));
  };
  const flags = proposal?.succeeded ? proposalFlags(proposal) : [];
  const numberDiffers = proposal?.succeeded && proposal.stpNumber.value && proposal.stpNumber.value.toLowerCase() !== stpNumber.toLowerCase();
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Import Word STP · ${stpNumber}`} crumbs={heading} />
    <section aria-label="Source" className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="space-y-1.5"><Label htmlFor="stp-import-file">Word STP (.docx)</Label>
        <Input id="stp-import-file" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div>
      <Button disabled={busy || !permission.allowed} onClick={() => void read("file")}><FileUp />{busy ? "Reading…" : "Read file"}</Button>
      {from ? <Button variant="outline" disabled={busy || !permission.allowed} onClick={() => void read("document")}><FileText />Read current document version</Button> : null}
      <p className="w-full text-xs text-muted-foreground">Nothing is saved until you apply the proposal. The Word document itself is not changed.</p>
    </section>
    {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    {proposal?.succeeded ? <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <aside aria-label="Values to check" className="space-y-2 self-start rounded-lg border bg-card p-4 lg:sticky lg:top-0">
        <h2 className="text-sm font-semibold">To check ({flags.length})</h2>
        {numberDiffers ? <p className="text-sm text-destructive">The file says {proposal.stpNumber.value}; it will be saved as {stpNumber}.</p> : null}
        {proposal.warnings.map((warning) => <p key={warning} className="text-sm">{warning}</p>)}
        <ul className="space-y-2">{flags.map((flag, index) => <li key={index} className="text-sm"><span className="flex items-center gap-2 font-medium">{flag.where}
          <Badge variant={flag.confidence === 2 ? "destructive" : "secondary"}>{flag.confidence === 2 ? "Missing" : "Check"}</Badge></span>
          <span className="text-muted-foreground">{flag.flag}</span></li>)}</ul>
        {flags.length === 0 && proposal.warnings.length === 0 ? <p className="text-sm text-muted-foreground">Everything was read from its expected place.</p> : null}
        <div className="space-y-2 border-t pt-3">
          {applying.target.kind === "blocked" ? <p className="text-sm text-muted-foreground">{applying.target.reason}</p>
            : <Button className="w-full" disabled={busy || applying.loading} onClick={() => void apply()}>{applyLabel[applying.target.kind]}</Button>}
          <p className="text-xs text-muted-foreground">You can correct everything in the editor before submitting.</p>
        </div>
      </aside>
      <StpProposalView proposal={proposal} />
    </div> : null}
  </article>;
}
