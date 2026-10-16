import { Check, Save, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export type DraftState = "empty" | "unsaved" | "saving" | "saved" | "failed";
const titles: Record<DraftState, string> = { empty: "", unsaved: "Save this answer as a draft", saving: "Saving…", saved: "Draft saved", failed: "The draft was not saved. Try again." };

/** Saves one answer as a draft. Shows whether it has unsaved changes, is being saved, or is saved. */
export function DraftButton({ state, label, onSave }: { state: DraftState; label: string; onSave: () => void }) {
  if (state === "empty") return null;
  const icon = state === "saving" ? <Spinner /> : state === "saved" ? <Check className="text-success" /> : state === "failed" ? <TriangleAlert className="text-destructive" /> : <Save className="text-warning" />;
  return <Button type="button" size="icon-sm" variant="outline" title={titles[state]} aria-label={`${titles[state]}: ${label}`} disabled={state === "saving" || state === "saved"} onClick={onSave}>{icon}</Button>;
}
