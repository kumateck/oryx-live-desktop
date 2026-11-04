# Workspace tabs proposal

The user revised and authorized the interaction on 2026-11-04: tabs now belong in
the desktop header; normal sidebar clicks use the active tab; Ctrl/Cmd-click or
the link context menu opens separately; a tab-header context menu offers Duplicate
tab. See [current behavior](workspace-tabs.md). The original design below is kept
as the historical proposal.

Date: 2026-11-03. Status: visual direction approved; desktop-only implementation
subsequently authorized. See [implementation notes](workspace-tabs.md).

## Approved visual reference

The user approved the [tabbed-workspace concept](design/workspace-tabs-concept.png)
on 2026-11-03. Use its integrated tab strip, active-tab treatment, close controls,
amber unsaved indicator, add-tab control and open-tabs menu as the visual direction.
The image was generated with the built-in image generation tool; its page fields,
record data and navigation labels are illustrative. Existing ERP behavior and the
current application remain authoritative. This approval does not expand the
design-only scope into implementation or settle the proposed behavior below.
The later instruction to start, restricted to desktop, authorizes the local work
documented separately in the implementation notes.

## Confirmed requirement

ERP staff need several pages open in one desktop window so they can consult one
record while working on another. Use browser-style tabs, with Codex as the user's
interaction reference. Sidebar clicks open a new tab or focus an existing matching
page. The user requests a design proposal before implementation. Everything below
is a recommendation for review rather than an additional confirmed requirement.

## Layout

Keep the shared header, module rail, sidebar and footer. Place a single compact
tab row at the top of the central workspace, outside its vertically scrolling
page. Page-level section tabs remain inside the page and keep their current role.
Preserve the existing typography, density, theme and appearance settings.

Each tab shows a short page or record title, an unsaved indicator when needed,
and a labelled close control. Include record reference or department context when
titles would otherwise be ambiguous. Long labels truncate with the full title
available on hover and keyboard focus. Active, inactive and focused states remain
distinct without relying only on accent color.

An Add tab control opens a picker of permitted destinations. An open-tabs menu
lists every tab by full title; confined strip scrolling or previous/next controls
keep the active tab reachable without introducing page/window horizontal scroll.
Use one row rather than wrapping tabs and consuming the page's working height.

## Navigation behavior

| User action | Proposed result |
| --- | --- |
| Click a sidebar destination | Open it in a new tab, or focus its existing matching tab without resetting that tab's filters or edits. |
| Open a record, edit screen or breadcrumb normally | Navigate within the active tab using its existing unsaved-work protection. |
| Choose Open in new tab on a supported internal link | Open or focus that destination separately, leaving the original tab intact. |
| Switch tabs | Restore that tab's page, filters, pagination, scroll and in-memory form state. |
| Change filters or page-level section | Update only the active tab. |
| Use Back or Forward | Traverse the active tab's page history; do not unexpectedly move through other tabs. |
| Close the active tab | Focus its immediate left neighbour, or the right neighbour if there is none on the left. |
| Close the final tab | Show a permitted page picker with no ERP page mounted. |

Match tabs by their current destination: pathname including record ID, plus
route-required query scope such as department, queue or material kind. Ordinary
search, pagination and scroll do not create separate identities. Focusing an
existing tab does not overwrite its current view with sidebar defaults. If a list
tab has navigated to a detail page, opening that list from the sidebar creates or
focuses a list tab rather than replacing the detail. Specific query-scope rules
must be verified against existing routes before implementation.

The active destination remains deep-linkable. Opening an external deep link into
a fresh app session creates one tab. Define and verify address-bar and browser
history synchronization with independent tab histories in the technical proof;
do not claim the current single browser router already provides it.

## Protecting work and access

Switching tabs must not discard work or trigger a leave-without-saving prompt.
Closing a dirty tab offers Keep editing or Discard and close. Keep editing returns
focus to that tab. Do not provide a generic Save action: each domain retains its
validation, permission checks, preflights and submission workflow. A tab with an
in-flight write cannot be discarded while its outcome is unresolved.

Voluntary sign-out, window close, refresh and a web-release update must consider
dirty work and pending writes across all tabs. An update must not treat a clean
active tab as proof that the workspace is safe to reload. Forced session expiry
or revoked access still prevents protected content and writes; retained tab state
must never override authentication or authorization. Clear tab state when the
account or connected site changes.

Every tab passes the owning module's manifest guard before data hooks mount.
Recheck access when permissions change, including inactive tabs. Existing action
checks and backend authorization remain authoritative. Inactive content cannot
hold keyboard focus, expose modal portals or leave page-scoped shortcuts active.
Background polling and secondary queries need explicit pause/resume behavior;
shared cache invalidation must still make a reopened tab show current records.

## Delivery boundary and acceptance

Implement in the hosted React workspace, retaining one shared session and RTK
Query cache. Continue generating routes from files. Tab lifecycle and independent
route state need a technical proof before broad integration; the current single
Outlet and pathname-based unsaved guard are insufficient. Include page search,
document titles, dialogs, toasts, errors and update safety in that proof so global
effects cannot accidentally act on another tab. No native webviews or additional
manual route list are proposed.

Recommend a first release with open/focus, switch, close, page picker, open-tabs
menu, supported internal-link opening and keyboard access. Defer drag reordering,
pinning, close-all actions, duplicate copies of the same destination, separate
windows and automatic restart restoration. Never silently evict a dirty tab to
meet a memory limit. Measure realistic multi-page usage before setting a limit.

Acceptance must demonstrate two different records and two independent forms,
retained list filters/scroll, safe close and failed-save handling, permission
revocation and session expiry, pending-write safety, all-tab update guards,
independent history and deep links. Verify keyboard focus and screen-reader tab
names/selection, shortcuts against Electron defaults, and overflow at 1366×768
and 1280×720 including Windows 125% and 150% scaling. Compare memory, polling and
route transitions with realistic simultaneous pages. No runtime or visual
acceptance has been performed as part of this proposal.
