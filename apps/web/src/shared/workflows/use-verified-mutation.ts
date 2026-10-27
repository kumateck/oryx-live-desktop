import { useLayoutEffect, useRef, useState } from "react";
import type { PermissionRequirement } from "../auth/access";
import { useCurrentUser } from "../auth/session-provider";
import { usePermissionAction } from "../auth/use-permission-action";

export const changedEvidence = "This record changed. Close this confirmation and review the current record before continuing.";
export const uncertainWrite = "The request was sent. Close this confirmation and check the current record before trying another action.";
export const evidenceFingerprint = (value: object) => JSON.stringify(value);

/** Freeze reviewed evidence, reread without cache, then check access and identity at the write boundary. */
export function useVerifiedMutation<T extends object>(require: PermissionRequirement, reviewed?: T) {
  const gate = usePermissionAction(require);
  const [reviewedEvidence] = useState(() => reviewed);
  const user = useCurrentUser();
  const identity = useRef<string | null>(user?.id ?? null);
  const mounted = useRef(true);
  const running = useRef(false);
  const sent = useRef(false);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  useLayoutEffect(() => { identity.current = user?.id ?? null; }, [user?.id]);
  useLayoutEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const run = async (original: T, read: () => Promise<T>, write: (fresh: T) => Promise<void>): Promise<string | null> => {
    if (running.current) return "A request is already running.";
    if (sent.current) return uncertainWrite;
    const actor = identity.current;
    const denied = gate.check();
    if (denied || !actor) return denied ?? "Sign in again before continuing.";
    running.current = true;
    setBusy(true);
    try {
      const fresh = await read();
      if (!mounted.current || identity.current !== actor) return "Your session changed. Open the current record again.";
      if (evidenceFingerprint(reviewedEvidence ?? original) !== evidenceFingerprint(fresh)) return changedEvidence;
      const revoked = gate.check();
      if (revoked) return revoked;
      // Once sent, a timeout/refusal cannot turn this same confirmation into a blind replay.
      sent.current = true;
      setAttempted(true);
      await write(fresh);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "The current record could not be verified. Refresh it before continuing.";
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return { run, busy, attempted, allowed: gate.allowed };
}
