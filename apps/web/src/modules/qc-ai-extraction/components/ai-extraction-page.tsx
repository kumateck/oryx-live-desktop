import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SettingsHeader } from "@/modules/settings-support/ui";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { aiExtractionApi, aiExtractionAudit, isActiveProvider, settingsSchema } from "../lib/ai-extraction";
import { ProviderCard } from "./provider-card";

export function AiExtractionPage() {
  const query = aiExtractionApi.useGetApiV1QcAiExtractionSettingsQuery(aiExtractionAudit);
  const parsed = useMemo(() => query.data ? settingsSchema.safeParse(query.data) : null, [query.data]);
  const settings = parsed?.success ? parsed.data : null;
  return <section className="min-w-0 space-y-4">
    <SettingsHeader title="AI extraction settings" description="Which provider the worksheet import's AI fallback uses for a file that no built-in recogniser matches, and its key." />
    {query.isLoading ? <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      : !settings ? <div role="alert" className="space-y-2 rounded-lg border p-4 text-sm"><p>{query.error ? apiErrorMessage(query.error) : "The server returned settings the app could not read."}</p>
        <Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>
      : <div className="grid gap-4 md:grid-cols-2">{settings.providers.map((status) => <ProviderCard key={`${status.provider}-${status.model}-${status.keyPreview ?? ""}`} status={status} active={isActiveProvider(settings, status)} />)}</div>}
  </section>;
}
