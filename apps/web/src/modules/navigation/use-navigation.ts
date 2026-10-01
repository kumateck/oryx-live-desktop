import { useMemo } from "react";
import { useLocation } from "react-router";
import { useAccess } from "../../shared/auth/use-access";
import { navigationCatalog } from "./catalog.generated";
import { activeNavigation, visibleNavigation } from "./navigation-model";

/** The sidebar groups this user may see and the entry matching the current address. */
export function useNavigation() {
  const { context } = useAccess();
  const { pathname, search } = useLocation();
  const groups = useMemo(() => visibleNavigation(navigationCatalog, context), [context]);
  const active = useMemo(() => activeNavigation(groups, pathname, search), [groups, pathname, search]);
  return { groups, active, pathname };
}
