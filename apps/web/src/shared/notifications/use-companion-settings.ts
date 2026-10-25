import { useCallback, useEffect, useState } from "react";
import { CompanionCommand, type CompanionPreferences } from "../../../../../shared/companion";
type SettingsState = { kind: "unavailable" } | { kind: "loading" } | { kind: "ready"; preferences: CompanionPreferences } | { kind: "error"; message: string };
export function useCompanionSettings() {
  const [state, setState] = useState<SettingsState>(() => window.oryxCompanion?.settings && window.oryxCompanion?.command ? { kind: "loading" } : { kind: "unavailable" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    const read = window.oryxCompanion?.settings;
    if (!read || !window.oryxCompanion?.command) { setState({ kind: "unavailable" }); return; }
    try { setState({ kind: "ready", preferences: await read() }); }
    catch { setState({ kind: "error", message: "Companion settings could not be loaded. Try again." }); }
  }, []);
  useEffect(() => {
    let active = true;
    const read = window.oryxCompanion?.settings;
    if (!read || !window.oryxCompanion?.command) return;
    void read().then((preferences) => { if (active) setState({ kind: "ready", preferences }); }, () => { if (active) setState({ kind: "error", message: "Companion settings could not be loaded. Try again." }); });
    const focus = () => { void reload(); };
    window.addEventListener("focus", focus);
    return () => { active = false; window.removeEventListener("focus", focus); };
  }, [reload]);
  const command = async (action: CompanionCommand) => {
    if (saving || !window.oryxCompanion?.command) return;
    setSaving(true); setError(null);
    try { setState({ kind: "ready", preferences: await window.oryxCompanion.command(action) }); }
    catch { setError("The companion change could not be saved. Try again."); }
    finally { setSaving(false); }
  };
  return { state, saving, error, command, reload };
}
