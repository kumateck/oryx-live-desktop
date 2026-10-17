import { useEffect, useState } from "react";
import { isStaleBuildError, reloadForNewRelease } from "./stale-build";

/**
 * For an error page: when the error is a page from an earlier release, load the current release once.
 * True while that reload is under way; false for any other error, or when the reload was just tried and failed.
 */
export function useReloadForNewRelease(error: Error | null): boolean {
  const stale = isStaleBuildError(error);
  const [failed, setFailed] = useState(false);
  useEffect(() => { if (stale && !reloadForNewRelease()) setFailed(true); }, [stale]);
  return stale && !failed;
}
