import { Component, type ErrorInfo, type ReactNode } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { reportApplicationError } from "./report-error";
import { useReloadForNewRelease } from "./use-reload-for-new-release";

interface Props { children: ReactNode }
interface State { failed: boolean }

export class GlobalErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    reportApplicationError(error, `renderer (${info.componentStack ?? "component"})`);
  }

  override render() {
    if (this.state.failed) return <div className="fatal-error" role="alert"><h1>Oryx could not continue</h1><p>Your work may not have been saved. Reconnect to the customer server and retry.</p><button type="button" onClick={() => window.location.reload()}>Retry</button></div>;
    return this.props.children;
  }
}

export function GlobalRouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) && error.status === 404 ? "Page not found." : "This page could not be opened.";
  const reloading = useReloadForNewRelease(error instanceof Error ? error : null);
  if (reloading) return <div className="boot-state" role="status">Oryx was updated. Loading the new version…</div>;
  if (error instanceof Error) reportApplicationError(error, "route");
  return <div className="fatal-error" role="alert"><h1>{message}</h1><button type="button" onClick={() => window.location.reload()}>Retry</button></div>;
}

export function BootFallback() { return <div className="boot-state" role="status">Opening Oryx…</div>; }
