import type { ReactNode } from "react";
import { Skeleton } from "../skeleton/skeleton";
import { PageBreadcrumbs, type PageCrumb } from "./page-breadcrumbs";

/**
 * Heading of a nested page. With nothing on the right, the breadcrumb sits there, level with the
 * title. When the page has actions they take the right side and the breadcrumb moves above the title.
 */
export function PageHeader({ title, crumbs, actions }: {
  /** Null while the title is still loading. */
  title: string | null;
  crumbs: readonly PageCrumb[];
  /** Buttons for the page. Pass nothing (not an empty wrapper) when there are none. */
  actions?: ReactNode;
}) {
  const heading = title === null ? <Skeleton className="h-7 w-64 max-w-full" /> : <h1 className="min-w-0 break-words text-xl font-semibold">{title}</h1>;
  if (!actions) return <header className="flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-2">
    {heading}<PageBreadcrumbs items={crumbs} />
  </header>;
  return <header className="min-w-0 space-y-2">
    <PageBreadcrumbs items={crumbs} />
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">{heading}<div className="flex flex-wrap items-center gap-2">{actions}</div></div>
  </header>;
}
