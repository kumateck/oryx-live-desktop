import { identityApi } from "@/shared/api/generated/identity";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { Button } from "@/components/ui/button";
import { SettingsHeader } from "@/modules/settings-support/ui";
import { signatureProfileSchema } from "../schemas/signature-schema";
import { signaturePath } from "../lib/signature-images";
import { signatureAudit } from "../hooks/use-save-signature";
import { SignatureForm } from "./signature-form";

export function SignatureWorkspace() {
  const user = useCurrentUser();
  const { has } = useAccess();
  const query = identityApi.useGetApiV1UserAuthenticatedQuery(signatureAudit, { skip: !user || !has("CanViewSignatureSettings"), refetchOnMountOrArgChange: true });
  const parsed = query.currentData ? signatureProfileSchema.safeParse(query.currentData) : null;
  const error = query.error ? apiErrorMessage(query.error) : parsed?.success === false || parsed?.success && parsed.data.id !== user?.id ? "Your signature profile could not be read safely." : null;
  return <section className="min-w-0 space-y-6"><SettingsHeader title="Signature settings" description="Manage the signature image used by your account." />
    {error ? <div role="alert" className="space-y-3"><p>{error}</p><Button variant="outline" onClick={() => { void query.refetch(); }}>Retry</Button></div>
      : !parsed?.success || !user ? <FormPageSkeleton label="Loading your signature" sections={[3]} />
      : has("CanCreateSignatureSettings") ? <SignatureForm key={user.id} userId={user.id} storedPath={signaturePath(parsed.data.signature)} />
      : <div><h2 className="font-medium">Saved signature</h2>{signaturePath(parsed.data.signature) ? <img className="h-28 max-w-full bg-white object-contain" src={signaturePath(parsed.data.signature) ?? ""} alt="Your saved signature" /> : <p>No signature has been saved.</p>}<p className="text-sm text-muted-foreground">You do not have permission to replace your signature.</p></div>}
  </section>;
}
