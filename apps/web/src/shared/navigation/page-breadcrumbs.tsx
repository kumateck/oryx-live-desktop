import { Fragment } from "react";
import { Link, useLocation } from "react-router";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { navigationCatalog } from "../../modules/navigation/catalog.generated";
import { navigationTrail } from "../../modules/navigation/navigation-model";
import { Skeleton } from "../skeleton/skeleton";

export interface PageCrumb {
  /** Null while the name is still loading; a placeholder is shown. */
  label: string | null;
  /** Leave out for the current page, and for steps that are not pages. */
  to?: string;
}

/**
 * Trail for a nested page. The start (group, heading, list page) comes from the sidebar entry the
 * address belongs to; the page adds the rest, such as the record's name and "Edit". Only real
 * pages are links, and the last crumb is the current page.
 */
export function PageBreadcrumbs({ items }: { items: readonly PageCrumb[] }) {
  const { pathname, search } = useLocation();
  const base: PageCrumb[] = navigationTrail(navigationCatalog, pathname, search)
    .map((crumb) => crumb.path ? { label: crumb.label, to: crumb.path } : { label: crumb.label });
  const crumbs = [...base, ...items];
  return <Breadcrumb><BreadcrumbList>
    {crumbs.map((crumb, index) => {
      const current = index === crumbs.length - 1;
      const text = crumb.label === null ? <Skeleton className="h-4 w-28" /> : <span className="block max-w-[28ch] truncate" title={crumb.label}>{crumb.label}</span>;
      return <Fragment key={`${index}-${crumb.label ?? "loading"}`}>
        {index > 0 ? <BreadcrumbSeparator /> : null}
        <BreadcrumbItem className="min-w-0">
          {current ? <BreadcrumbPage className="min-w-0">{text}</BreadcrumbPage> :
            crumb.to ? <BreadcrumbLink asChild><Link to={crumb.to} className="min-w-0">{text}</Link></BreadcrumbLink> : text}
        </BreadcrumbItem>
      </Fragment>;
    })}
  </BreadcrumbList></Breadcrumb>;
}
