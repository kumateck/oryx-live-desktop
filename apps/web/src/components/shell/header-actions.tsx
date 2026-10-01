import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useSession } from "@/shared/auth/session-provider";
import { useTheme } from "../../shared/theme/theme-provider";
import type { NavigationGroup } from "../../modules/navigation/navigation-model";
import { AccountMenu } from "./account-menu";
import { AnimatedSearch } from "./animated-search";
import { NotificationSheet, type HeaderNotification } from "./notification-sheet";
import "./header-actions.css";

export interface HeaderActionsProps {
  /** Navigation the signed-in user can see; searched by the header search. */
  pages: readonly NavigationGroup[];
  notifications?: readonly HeaderNotification[];
  onMarkRead?: (id: string) => void;
}

const noNotifications: readonly HeaderNotification[] = [];

export function HeaderActions({ pages, notifications = noNotifications, onMarkRead }: HeaderActionsProps) {
  const theme = useTheme();
  const { logout } = useSession();
  const user = useCurrentUser();
  return <div className="header-actions"><AnimatedSearch groups={pages} />
    <Button type="button" size="icon-sm" variant="outline" className="header-action" onClick={theme.toggle} aria-label={`Switch to ${theme.resolved === "dark" ? "light" : "dark"} theme`} title="Switch theme">{theme.resolved === "dark" ? <Sun /> : <Moon />}</Button>
    <NotificationSheet notifications={notifications} onMarkRead={onMarkRead} />
    <AccountMenu user={user} onLogout={logout} />
  </div>;
}
