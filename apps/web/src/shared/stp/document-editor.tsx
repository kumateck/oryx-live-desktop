import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorCode, apiErrorMessage } from "@/shared/errors/api-error-message";
import { stpDocumentExtraApi } from "./stp-document-api";

declare global {
  interface Window { DocsAPI?: { DocEditor: new (elementId: string, config: object) => { destroyEditor?: () => void } } }
}

// The document server's editor script is loaded once per server and shared by every editor on the page.
const scripts = new Map<string, Promise<void>>();
function loadEditorScript(server: string): Promise<void> {
  const origin = new URL(server).origin;
  const cached = scripts.get(origin);
  if (cached) return cached;
  const loading = new Promise<void>((resolve, reject) => {
    if (window.DocsAPI) { resolve(); return; }
    const script = document.createElement("script");
    script.src = `${server.replace(/\/$/, "")}/web-apps/apps/api/documents/api.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("The document editor could not be loaded from the document server."));
    document.head.appendChild(script);
  });
  scripts.set(origin, loading);
  loading.catch(() => scripts.delete(origin));
  return loading;
}

/**
 * The Word editor for one STP document, served by the organisation's document server. The server decides from the
 * document's status whether it opens for editing (a draft) or read-only; this only shows what the session allows.
 */
export function DocumentEditor({ documentId, height = "70vh" }: { documentId: string; height?: string }) {
  const container = `stp-editor-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [openSession] = stpDocumentExtraApi.useOpenStpEditorMutation();
  const [state, setState] = useState<{ status: "loading" } | { status: "ready" } | { status: "error"; message: string }>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let editor: { destroyEditor?: () => void } | null = null;
    setState({ status: "loading" });
    void (async () => {
      const session = await openSession({ documentId });
      if (cancelled) return;
      if ("error" in session) {
        setState({ status: "error", message: apiErrorCode(session.error) === "StpDocument.Locked"
          ? "Someone else is editing this document. Try again shortly." : apiErrorMessage(session.error) });
        return;
      }
      try {
        await loadEditorScript(session.data.documentServerUrl);
        if (cancelled) return;
        if (!window.DocsAPI) throw new Error("The document editor did not start.");
        editor = new window.DocsAPI.DocEditor(container, structuredClone(session.data.config));
        setState({ status: "ready" });
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: error instanceof Error ? error.message : "The document editor did not start." });
      }
    })();
    return () => { cancelled = true; editor?.destroyEditor?.(); };
  }, [documentId, container, openSession, attempt]);
  return <div className="relative w-full overflow-hidden rounded-lg border bg-card" style={{ height }}>
    {state.status !== "ready" ? <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background p-4 text-center">
      {state.status === "loading" ? <><Spinner /><p className="text-sm text-muted-foreground">Opening the document…</p></>
        : <><p role="alert" className="max-w-sm text-sm text-destructive">{state.message}</p><Button size="sm" variant="outline" onClick={() => setAttempt((value) => value + 1)}>Retry</Button></>}
    </div> : null}
    <div id={container} className="h-full w-full" />
  </div>;
}
