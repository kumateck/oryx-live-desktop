import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/shared/skeleton/page-skeletons";
import { apiErrorMessage } from "@/shared/errors/api-error-message";

export function LoadState({ loading, message, retry }: { loading: boolean; message: string; retry: () => void }) {
  if (loading) return <PageSkeleton />;
  return <section className="space-y-3" role="alert"><h1 className="text-lg font-semibold">White Placebo could not load</h1>
    <p>{message}</p><Button variant="outline" onClick={retry}>Retry</Button></section>;
}
export { apiErrorMessage };
