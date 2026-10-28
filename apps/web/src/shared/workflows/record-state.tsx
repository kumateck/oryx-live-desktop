import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DetailPageSkeleton } from "../skeleton/page-skeletons";

export function RecordState<T>({ loading, error, data, retry, children }: {
  loading: boolean; error?: string | null; data: T | null | undefined; retry: () => void; children: (record: T) => ReactNode;
}) {
  if (loading) return <DetailPageSkeleton label="Loading record" />;
  if (error || data === null || data === undefined) return <div role="alert" className="space-y-3 py-6">
    <p>{error || "This record could not be read. Refresh it before taking an action."}</p>
    <Button type="button" variant="outline" onClick={retry}>Retry</Button>
  </div>;
  return <>{children(data)}</>;
}
