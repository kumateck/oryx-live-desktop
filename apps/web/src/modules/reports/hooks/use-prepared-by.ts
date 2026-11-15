import { z } from "zod";
import { identityApi } from "@/shared/api/generated/identity";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { reportsAudit } from "../lib/report-model";

const ownProfile = z.object({ id: z.string(), signature: z.string().nullish() });

/**
 * The person printing a report signs it as "Prepared by": their name and the signature saved in
 * signature settings. The profile is the caller's own account, so no extra permission is needed.
 * With no saved signature the line stays blank for a signature by hand.
 */
export function usePreparedBy(): { name: string | null; signature: string | null } {
  const user = useCurrentUser();
  const query = identityApi.useGetApiV1UserAuthenticatedQuery(reportsAudit, { skip: !user });
  const parsed = ownProfile.safeParse(query.currentData);
  const own = parsed.success && parsed.data.id === user?.id ? parsed.data : null;
  return { name: user?.name || null, signature: own?.signature ?? null };
}
