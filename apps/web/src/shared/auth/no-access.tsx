import { Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "./session-provider";

export function NoAccess() {
  const navigate = useNavigate();
  const { refresh } = useSession();
  const [checking, setChecking] = useState(false);
  const check = async () => {
    if (checking) return;
    setChecking(true);
    try { await refresh(); } finally { setChecking(false); }
  };
  return <section role="alert" aria-labelledby="no-access-title" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
    <span className="flex size-12 items-center justify-center rounded-full border bg-muted text-muted-foreground"><Lock aria-hidden="true" className="size-5" /></span>
    <h1 id="no-access-title" className="text-xl font-semibold">You don't have access to this page</h1>
    <p className="text-sm text-muted-foreground">Your role does not include this area. Ask an administrator if you need it for your work.</p>
    <div className="flex flex-wrap justify-center gap-2 pt-2">
      <Button type="button" size="sm" variant="outline" onClick={() => void navigate(-1)}>Go back</Button>
      <Button type="button" size="sm" onClick={() => void navigate("/home")}>Home</Button>
      <Button type="button" size="sm" variant="outline" disabled={checking} onClick={() => void check()}>
        {checking ? <><Spinner />Checking access…</> : "Refresh access"}
      </Button>
    </div>
  </section>;
}
