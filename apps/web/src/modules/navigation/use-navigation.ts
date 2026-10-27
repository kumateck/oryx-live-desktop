import { useMemo } from "react";
import { useLocation } from "react-router";
import { useAccess } from "../../shared/auth/use-access";
import { navigationCatalog } from "./catalog.generated";
import { activeNavigation, visibleNavigation } from "./navigation-model";
import { availableNavigation, pagePath } from "./availability";

const concretePages = Object.keys(import.meta.glob("../../pages/**/page.tsx")).map(pagePath);
const availableCatalog = availableNavigation(navigationCatalog, concretePages);

/** The sidebar groups this user may see and the entry matching the current address. */
export function useNavigation() {
  const { context } = useAccess();
  const { pathname, search } = useLocation();
  const groups = useMemo(() => visibleNavigation(availableCatalog, context), [context]);
  const active = useMemo(() => activeNavigation(groups, pathname, search), [groups, pathname, search]);
  return { groups, active, pathname };
}
