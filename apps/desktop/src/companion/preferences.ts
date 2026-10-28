import { readFile, writeFile } from "node:fs/promises";
import { CompanionCommand, type CompanionPreferences } from "./contract";
export function parsePreferences(value: object, fallback: CompanionPreferences): CompanionPreferences {
  if (!value || typeof value !== "object") return fallback;
  return {
    showIndicators: "showIndicators" in value && typeof value.showIndicators === "boolean" ? value.showIndicators : fallback.showIndicators,
    visible: "visible" in value && typeof value.visible === "boolean" ? value.visible : fallback.visible,
    quiet: "quiet" in value && typeof value.quiet === "boolean" ? value.quiet : fallback.quiet,
    roaming: "roaming" in value && typeof value.roaming === "boolean" ? value.roaming : fallback.roaming,
  };
}
export function nextPreferences(current: CompanionPreferences, command: CompanionCommand): CompanionPreferences {
  switch (command) {
    case CompanionCommand.Show: return { ...current, visible: true };
    case CompanionCommand.Hide: return { ...current, visible: false };
    case CompanionCommand.QuietOn: return { ...current, quiet: true };
    case CompanionCommand.QuietOff: return { ...current, quiet: false };
    case CompanionCommand.RoamingOn: return { ...current, roaming: true };
    case CompanionCommand.RoamingOff: return { ...current, roaming: false };
    case CompanionCommand.ResetPosition: return current;
    case CompanionCommand.IndicatorsOn: return { ...current, showIndicators: true };
    case CompanionCommand.IndicatorsOff: return { ...current, showIndicators: false };
    default: throw new Error("Invalid companion command.");
  }
}
export class CompanionPreferenceStore {
  private value: CompanionPreferences = { visible: true, quiet: false, roaming: true, showIndicators: true };
  private pending: Promise<void> = Promise.resolve();
  constructor(private file: string) {}
  current(): CompanionPreferences { return { ...this.value }; }
  async load(visible: boolean): Promise<CompanionPreferences> {
    this.value.visible = visible;
    try { this.value = parsePreferences(JSON.parse(await readFile(this.file, "utf8")), this.value); } catch { /* first run or malformed local data */ }
    return this.current();
  }
  change(command: CompanionCommand): Promise<CompanionPreferences> {
    const result = this.pending.then(async () => {
      const next = nextPreferences(this.value, command);
      await writeFile(this.file, JSON.stringify(next), { mode: 0o600 });
      this.value = next;
      return this.current();
    });
    this.pending = result.then(() => {}, () => {});
    return result;
  }
}
