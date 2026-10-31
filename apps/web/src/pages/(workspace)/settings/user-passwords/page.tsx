import { SettingsHeader } from "@/modules/settings-support/ui";
import { UserPasswordForm } from "@/modules/user-passwords/components/user-password-form";

// Access is limited to the password administrator by the module manifest, before this page mounts.
export default function UserPasswordsPage() {
  return <section className="min-w-0 space-y-6">
    <SettingsHeader title="Change user password" description="Set a new password for another user. They are signed out of other sessions and need the new password to sign in." />
    <UserPasswordForm />
  </section>;
}
