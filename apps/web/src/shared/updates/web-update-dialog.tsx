import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { WebRelease } from "../../../../../shared/desktop-updates";
interface Props { open: boolean; release: WebRelease | null; required: boolean; error: string; close: () => void; reload: () => void; updateDesktop: () => void }
function updateCopy(release: WebRelease | null, required: boolean): { title: string; description: string } {
  if (required) return { title: "Desktop update required", description: `This web release needs desktop ${release?.minimumShellVersion} or newer.` };
  if (release) return { title: "A web update is ready", description: "The latest Oryx web release is ready to load. Finish your work before refreshing." };
  return { title: "Desktop updates", description: "Install the update-enabled desktop app to download future desktop releases from Oryx." };
}
function UpdateAction({ release, required, reload, updateDesktop, bridge }: Pick<Props, "release" | "required" | "reload" | "updateDesktop"> & { bridge: boolean }) {
  if (!required && release) return <Button type="button" onClick={reload}>Refresh now</Button>;
  if (bridge) return <Button type="button" onClick={updateDesktop}>{required ? "Update desktop" : "Open desktop updater"}</Button>;
  return <Button asChild><a href="/downloads/OryxLiveDesktop-Setup.exe" target="_blank" rel="noopener noreferrer">Download desktop installer</a></Button>;
}
export function WebUpdateDialog({ open, release, required, error, close, reload, updateDesktop }: Props) {
  const bridge = Boolean(window.oryxUpdates);
  const copy = updateCopy(release, required);
  return <Dialog open={open} onOpenChange={(value) => { if (!value) close(); }}><DialogContent>
    <DialogHeader><DialogTitle>{copy.title}</DialogTitle>
      <DialogDescription>{copy.description}</DialogDescription>
    </DialogHeader>
    <DialogBody>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {!release && !bridge ? <p className="text-sm text-muted-foreground">Your administrator must first publish the latest desktop installer. Your server address and saved sign-in are preserved when upgrading.</p> : null}
    </DialogBody>
    <DialogFooter><Button type="button" variant="outline" onClick={close}>Remind me later</Button>
      <UpdateAction release={release} required={required} reload={reload} updateDesktop={updateDesktop} bridge={bridge} />
    </DialogFooter>
  </DialogContent></Dialog>;
}
