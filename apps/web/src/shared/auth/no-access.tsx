import { Lock } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

export function NoAccess() {
  const navigate = useNavigate();
  return <section role="alert" aria-labelledby="no-access-title" className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
    <span className="flex size-12 items-center justify-center rounded-full border bg-muted text-muted-foreground"><Lock aria-hidden="true" className="size-5" /></span>
    <h1 id="no-access-title" className="text-xl font-semibold">You don't have access to this page</h1>
    <p className="text-sm text-muted-foreground">Your role does not include this area. Ask an administrator if you need it for your work.</p>
    <div className="flex gap-2 pt-2">
      <Button type="button" size="sm" variant="outline" onClick={() => void navigate(-1)}>Go back</Button>
      <Button type="button" size="sm" onClick={() => void navigate("/home")}>Home</Button>
    </div>
  </section>;
}
