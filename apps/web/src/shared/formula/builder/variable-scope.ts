import { FormulaScope } from "../core/contracts";

type Config = Record<string, unknown>;

export const variableScopeFor = (config: Config, key: string): FormulaScope => {
  const scopes = config.variableScopes;
  if (!scopes || typeof scopes !== "object" || Array.isArray(scopes))
    return FormulaScope.Placement;
  const raw = (scopes as Config)[key];
  const value = Number(
    raw && typeof raw === "object" && !Array.isArray(raw) && "value" in raw
      ? (raw as Config).value
      : raw,
  );
  return value === FormulaScope.Form
    ? FormulaScope.Form
    : FormulaScope.Placement;
};
