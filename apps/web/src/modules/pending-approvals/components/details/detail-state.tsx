import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { toLargestUnit } from "@/shared/units/quantity";

/** The three states a document's content can be in while it is read from the server. */
export function DetailState<T>({ loading, error, onRetry, value, label, children }: { loading: boolean; error: string | null; onRetry: () => void; value: T | null; label: string; children: (value: T) => ReactNode }) {
  if (loading) return <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading the {label}…</p>;
  if (value === null) return <div role="alert" className="space-y-2 rounded-md border border-destructive/50 p-3 text-sm">
    <p>The {label} could not be shown: {error ?? "the server returned something the app could not read."}</p>
    <Button type="button" size="sm" variant="outline" onClick={onRetry}>Retry</Button></div>;
  return <>{children(value)}</>;
}
/** The same three states, read off an RTK Query result. */
export const queryState = (query: { isLoading: boolean; error?: unknown; refetch: () => unknown }) => ({ loading: query.isLoading, error: query.error ? apiErrorMessage(query.error) : null, onRetry: () => { void query.refetch(); } });

export const quantity = (value: number | null | undefined, unit: string | null | undefined) => value === null || value === undefined ? "–" : toLargestUnit(value, unit ?? null, "calculated")?.text ?? String(value);
export const fullName = (person: { firstName?: string | null | undefined; lastName?: string | null | undefined } | null | undefined) => [person?.firstName, person?.lastName].filter(Boolean).join(" ") || null;
