import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { PermissionModule } from "../schemas/permission-schema";
import { accessCount, groupPermissions, searchPermissions, setAccessForKeys, type PermissionRow } from "../lib/permission-groups";

/**
 * The state of the permission editor: which module and submodule are open, and what a search finds.
 * A search looks through every module, so a permission can be found without knowing where it lives.
 */
export function usePermissionPicker(modules: PermissionModule[], onChange: (next: PermissionModule[]) => void, disabled: boolean) {
  const [moduleName, setModuleName] = useState("");
  const [groupName, setGroupName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // Typing stays responsive on a large catalogue: the list catches up after the keystroke.
  const query = useDeferredValue(search.trim());
  const selected = modules.find((module) => module.module === moduleName) ?? modules[0];
  const groups = useMemo(() => groupPermissions(selected?.children ?? []), [selected]);
  const group = groupName && groups.has(groupName) ? groupName : groups.keys().next().value ?? "";
  const searching = query.length > 0;
  const visible = useMemo((): PermissionRow[] => searching ? searchPermissions(modules, query)
    : (groups.get(group) ?? []).map((item) => ({ item, module: selected?.module ?? "" })), [searching, modules, query, selected, groups, group]);
  const total = useMemo(() => modules.reduce((sum, module) => sum + accessCount(module.children), 0), [modules]);
  // The latest catalogue and handler, read when a switch is flipped, so the handler given to each row never changes.
  const latest = useRef({ modules, onChange, disabled });
  useEffect(() => { latest.current = { modules, onChange, disabled }; });
  const change = useCallback((keys: ReadonlySet<string>, enabled: boolean) => {
    const now = latest.current;
    if (!now.disabled && keys.size > 0) now.onChange(setAccessForKeys(now.modules, keys, enabled));
  }, []);
  const toggle = useCallback((key: string, enabled: boolean) => change(new Set([key]), enabled), [change]);
  const chooseModule = (value: string) => { setModuleName(value); setGroupName(null); setSearch(""); };
  const chooseGroup = (value: string) => { setGroupName(value); setSearch(""); };
  return { selected, groups, group, search, setSearch, searching, visible, total, change, toggle, chooseModule, chooseGroup };
}
