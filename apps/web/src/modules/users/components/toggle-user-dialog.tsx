import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePutApiV1UserToggleDisableByIdMutation } from "../api/user-api";
import { audit } from "../lib/user-access";
import type { UserRow } from "../schemas/user-schema";

/** Confirms blocking or unblocking. The endpoint flips the current state, so the dialog states which way it will go. */
export function ToggleUserDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [toggle, mutation] = usePutApiV1UserToggleDisableByIdMutation();
  const [message, setMessage] = useState("");
  const blocking = !user.isDisabled;

  const confirm = async () => {
    setMessage("");
    const result = await toggle({ ...audit, id: user.id });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(blocking ? `${user.name} was blocked` : `${user.name} was unblocked`);
    onClose();
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isLoading) onClose(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>{blocking ? "Block" : "Unblock"} {user.name}?</DialogTitle>
        <DialogDescription>{blocking
          ? "They will not be able to sign in until the account is unblocked. Their records and history are kept."
          : "They will be able to sign in again with their existing role."}</DialogDescription></DialogHeader>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={mutation.isLoading} onClick={onClose}>Cancel</Button>
        <Button type="button" variant={blocking ? "destructive" : "default"} disabled={mutation.isLoading} onClick={() => void confirm()}>
          {mutation.isLoading ? <><Spinner />Working…</> : blocking ? "Block user" : "Unblock user"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
