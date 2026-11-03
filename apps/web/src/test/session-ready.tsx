import type { ReactNode } from "react";
import { useCurrentUser } from "@/shared/auth/session-provider";

/** Mirror route guards so a directly rendered form mounts after session startup. */
export function SessionReady({ children }: { children: ReactNode }) {
  return useCurrentUser() ? children : null;
}
