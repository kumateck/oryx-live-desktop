# Desktop workspace tabs

Implemented locally on 2026-11-03 after approval of the
[visual concept](design/workspace-tabs-concept.png). The user explicitly restricts
workspace tabs to installed Electron desktops. No customer deployment, installer
publication, backend contract or business workflow change is included.

## Using tabs

The [implemented header layout](design/workspace-tabs-header.png) shows the
2026-11-04 revision; the original concept remains preserved separately. The tab
behaviours below were added on 2026-11-05 to follow browser, VS Code, Claude and
Codex conventions, keeping the tabs in the header.

Normal sidebar, record, edit and breadcrumb links navigate within the active tab,
using its unsaved-change and pending-save guards. Ctrl/Cmd-click, middle-click and the internal
link context menu open a new tab beside the current one. External URLs and API/file links retain
their normal handling.

The desktop header contains Back/Forward before the navigation-panel toggle,
followed by the tabs, New tab (+) immediately after the final visible tab, and the
All open tabs menu. Tabs are compact pills showing their module icon and title;
they shrink to fit and then scroll (mouse wheel works, with edge fades) without
page or window horizontal scrolling. The close button shows on hover and on the
current tab; an unsaved tab shows an amber dot in its place until hovered. A
spinner replaces the icon while a tab is saving. Tabs can be dragged to reorder,
and double-clicking the empty bar opens a new tab. Closing a tab selects its
right-hand neighbour. New tab opens a searchable picker of permitted destinations;
closing the final page leaves that picker.

Right-clicking a tab offers Close, Close other tabs, Close tabs to the right,
Duplicate, Move left/right, New tab and Reopen closed tab. Duplicate opens an
independent copy of the tab's current URL, including query filters and fragment,
next to the original; the original keeps its draft and the duplicate starts with
fresh page state and history. Duplicate is blocked while any write is pending.
Bulk closes never discard work: tabs with unsaved changes stay open and a notice
says how many were kept. The All open tabs menu lists full titles and Reopen
closed tab (the last 20 closed pages; locations only, never drafts).

| Shortcut | Action |
| --- | --- |
| Ctrl/Cmd+T | New tab (page picker) |
| Ctrl/Cmd+W | Close tab (asks first if unsaved) |
| Ctrl/Cmd+Shift+T | Reopen closed tab |
| Ctrl+Tab / Ctrl+Shift+Tab, Ctrl+PageDown / PageUp | Next / previous tab |
| Ctrl/Cmd+1…8, Ctrl/Cmd+9 | Go to tab by position, last tab |
| Ctrl/Cmd+B (outside text fields) | Show/hide the module sidebar |
| Alt+Left / Alt+Right | Back / forward in the current tab |
| Arrows, Home, End, Delete (tab bar focused) | Select tabs, close the selected tab |

The native File → New tab/Close tab and Go → Back/Forward/Home menu items reach
the same actions through the narrow validated preload subscription.

The module sidebar's open/closed state is shared by all tabs and remembered
across launches (a layout preference only). The shell subscribes to that state;
reading it without subscribing left the toggle without effect in the desktop app.

Right-click a tab header and choose **Duplicate tab** to open an independent copy
of its current URL, including query filters and fragment, next to the original.
The original retains its draft; the duplicate starts with fresh page state and
history. Duplicate is blocked while any write is pending. Ordinary Open in new tab
commands still focus an existing matching destination; Duplicate explicitly allows
two tabs at the same destination. The header change uses the existing hosted shell
and requires no native bridge or installer change.

Browser sessions do not load the desktop router or register its shortcuts. The
desktop check uses the existing isolated `oryxSession` capability, never a URL
parameter or user-agent guess. It is a presentation choice, not authorization.

## Page state and safety

Each tab owns a memory router created from the generated routes, its location,
history, title and in-memory page state. Query identity excludes search, paging,
sorting and release cache keys; other query parameters remain distinct. Omitted
permission choices normalize through the route manifest's first allowed choice,
so the default raw/packaging or active/inactive view does not open duplicates.
There is no additional manual route inventory or native webview.

The active location replaces the window URL for deep links, refresh and reconnect.
Refreshing restores that one location, not every open tab or draft. Account/site
changes discard tab state; a department change also resets the desktop API cache.
Session and API cache are shared across tabs within that scope. Permission
revocation still removes protected content before its data hooks can mount, and
existing mutation permission/record-state checks remain authoritative.

Keep domain controllers mounted across tab switches. Some existing editors own
draft rows outside RHF or initialize dependent fields in effects; suspending an
entire page would restart those effects and risk losing work. Header effects and
portals use React Activity independently. Hidden tab containers are inert, with
an explicit hidden style; inactive portals retain their controls without trapping
focus or displaying dialogs over another page. Known production
polling hooks stop polling while their desktop tab is inactive. Ordinary cache
subscriptions remain, so invalidated records can still become current.

FormWizard registers dirty state and asynchronous submission separately. Existing
UnsavedChangesGuard users register with one blocker per desktop router; browser
guards retain their prior behavior. Role permission overrides and bulk material
link drafts also register explicitly. New custom editors that keep changes outside
these contracts must call `useDesktopTabSafety(dirty, pending)`; do not assume
arbitrary local state can be inferred as a draft.

Dirty tabs show an amber dot and ask before discard/close. Ordinary route changes
retain leave-without-saving confirmation. Pending form submissions/preflights and
API mutations block page switching and closure until their outcome is known.
The pending check is repeated at the final close/discard action. Voluntary sign-out
checks all tabs; department switching requires saved/discarded work first. A guard
owned outside tab portals accounts for every tab during native close, reload and
web-release refresh. Forms and secrets are not persisted as tab restoration data.

## Verification and release limits

The final full web suite passed (336 files, 1,869 tests); the targeted run also
passed 178 tests across 27 files, including
the changed domain hooks, roles, materials, shell, forms and update safety. Route
generation/navigation checks and desktop typecheck/unit tests passed. The web
production build passed; existing large-chunk and attachment import warnings remain.
React Doctor's final tracked-change scan reported no issues. The design detector
reported no findings for the tab feature/shell targets.

Isolated browser automation used sample API responses, with no business writes.
It verified draft retention in the real material dialog, hidden-dialog behavior,
all-tab refresh protection, cleanup of dirty indicators, picker/switching and a
browser session without the workspace strip. A separate compiled Electron smoke
test used a uniquely named application, temporary user-data directory and localhost
fixtures; native File → New tab/Close tab reached the hosted workspace through
the real sandboxed preload. No saved customer profile was used. Captures at 1366×768 and 1280×720,
plus CSS viewport equivalents of Windows 125%/150% scaling, showed one active
workspace, visible footer and no page/window horizontal overflow. These are layout
simulations, not acceptance on actual Windows display scaling. See the
[implemented desktop screenshot](design/workspace-tabs-implemented.png).

Tab state stays in memory without automatic eviction or a hard tab limit. Realistic
production workloads, extended-session memory, customer Windows laptops and the
signed installer/installed-upgrade path remain release acceptance work. Older
shells can use hosted tab controls; native File/Go tab commands need the shell
containing `oryxWorkspace`. Do not raise the minimum shell version solely for
controls that remain usable without that bridge. No version/feed has been changed.

Local Forge packaging compiled the native/preload/renderer targets and returned
zero after Finalizing package, but no output application appeared under the
configured out directory. Treat that as an unverified package result, not an
installable release. Publishing still requires a reproducible artifact and the
existing installed Windows update smoke test.
