import { SettingsHeader } from "@/modules/settings-support/ui";
import { PasswordForm } from "@/modules/change-password/components/password-form";
export default function ChangePasswordPage() { return <section className="min-w-0 space-y-6">
  <SettingsHeader title="Change password" description="Update your own account password using your current password." /><PasswordForm />
</section>; }
