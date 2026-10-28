import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "./session-provider";

export function SessionGate({ children }: { children: ReactNode }) {
  const { state, retry } = useSession();
  const location = useLocation();
  if (state.status === "loading") return <div className="boot-state" role="status"><Spinner />Checking your session…</div>;
  if (state.status === "error") return <div className="boot-state flex-col gap-3" role="alert">
    <p>{state.message}</p>
    <Button type="button" variant="outline" onClick={() => void retry()}>Retry</Button>
  </div>;
  if (state.status === "anonymous") {
    // After a deliberate sign-out the next person starts at their own home, not the previous user's page.
    if (state.reason === "signed-out") return <Navigate to="/login" replace />;
    const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}
