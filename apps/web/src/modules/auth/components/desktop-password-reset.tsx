import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { desktopPasswordResetLink } from "../../../../../../shared/password-reset-link";
import { isDesktopRenderer } from "@/shared/workspace-tabs/is-desktop";
import { launchDesktopPasswordReset } from "../lib/desktop-password-reset";

export function DesktopPasswordReset({ resetKey }: { resetKey: string }) {
  const [params] = useSearchParams();
  const desktop = isDesktopRenderer() || params.get("desktop") === "1";
  const address = desktopPasswordResetLink(window.location.origin, resetKey);
  const attempted = useRef("");
  useEffect(() => {
    if (desktop || !address || attempted.current === address || window.top !== window.self) return;
    attempted.current = address;
    launchDesktopPasswordReset(address);
  }, [address, desktop]);
  if (desktop || !address) return null;
  return <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
    <p>Opening Oryx Live Desktop. Allow your browser to open the app if prompted.</p>
    <Button asChild variant="outline" className="w-full"><a href={address}>Open in desktop</a></Button>
    <p className="text-muted-foreground">If the app is not installed or does not open, continue with the form below.</p>
  </div>;
}
