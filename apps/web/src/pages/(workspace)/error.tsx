import { isRouteErrorResponse, useRouteError } from "react-router";
import { reportApplicationError } from "../../shared/errors/report-error";

export default function WorkspaceError() {
  const error = useRouteError();
  if (error instanceof Error) reportApplicationError(error, "workspace route");
  const message = isRouteErrorResponse(error) && error.status === 404 ? "Page not found." : "This page could not be opened.";
  return <div className="page-state" role="alert">{message}</div>;
}
