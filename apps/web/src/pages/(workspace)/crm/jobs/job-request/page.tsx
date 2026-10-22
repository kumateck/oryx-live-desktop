import { Navigate } from "react-router";

/** The CRM address for job requests opens the services job request list. */
export default function Route() {
  return <Navigate to="/extrals/job-requests" replace />;
}
