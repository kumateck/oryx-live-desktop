import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "../../components/ui/button";
import { reportApplicationError } from "../../shared/errors/report-error";
import { isStaleBuildError } from "../../shared/errors/stale-build";
import { useReloadForNewRelease } from "../../shared/errors/use-reload-for-new-release";

export default function WorkspaceError() {
  const error = useRouteError();
  const failure = error instanceof Error ? error : null;
  // A page from an earlier release loads the current one rather than stopping here.
  const reloading = useReloadForNewRelease(failure);
  useEffect(() => { if (failure && !reloading) reportApplicationError(failure, "workspace route"); }, [failure, reloading]);
  if (reloading) return <div className="page-state" role="status">Oryx was updated. Loading the new version…</div>;
  const message = isRouteErrorResponse(error) && error.status === 404 ? "Page not found." : "This page could not be opened.";
  return <div className="page-state flex flex-col items-center gap-3" role="alert"><p>{message}</p>
    {isStaleBuildError(failure) ? <p className="text-sm text-muted-foreground">The new version of Oryx could not be loaded. Check the connection to the server.</p> : null}
    <Button type="button" variant="outline" onClick={() => window.location.reload()}>Reload</Button></div>;
}
