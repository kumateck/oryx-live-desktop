# ORYX Companion — Operations Watch

## Collapsible alert card (2026-10-25)

The alert card below the avatar starts collapsed as a 32 DIP header showing
priority and unread count. Click the header to expand the bounded, scrollable
notification feed; click it again to collapse. The native companion window
resizes with the card, leaving the desktop area below it available when closed.
The expansion choice is local to the current shell run and defaults to
collapsed on launch. **Show alert details** in Appearance still controls whether
the entire card is visible. Alert selection, unread state, backend priority,
and navigation behavior are unchanged. Documentation updated: this guide,
`docs/services.md`, and `docs/workflows.md`.

The desktop shell includes an optional local, transparent, always-on-top 176 × 176 DIP companion window. Its Canvas 2D renderer displays the illustrated oryx at approximately 112 DIP tall inside a 128 DIP logical frame. View → Show / Hide ORYX Companion toggles it; the choice survives restart. Drag the painted character to move it. Position is kept locally and clamped to connected display work areas. Right-click offers Open Oryx, Quiet mode, Reset position, and Hide.

## Useful places in this application

| Workflow | Existing evidence / entry point | Companion role |
| --- | --- | --- |
| Stock exceptions | Notification types 3–5 and 15; warehouse linked/expired materials | Attract attention to an actual arrival, show unread count; open the existing notification sheet and its record links. |
| My pending approvals | Types 9–11; `/qa/pending-approvals` | Bring a reviewer back to requests. Decisions remain inside the permission-guarded workflow. |
| Production operations | Types 0, 8, 13–14; `/production/activities` | Surface stage changes and batch-record requests/decisions already notified by the backend. |
| Procurement and warehouse handoffs | Types 2, 6–7; distribution and stock-requisition pages | Point to arriving shipments and requisitions through existing notification links. |
| Assigned work | Types 1, 16–20 | Include existing unread notifications. Types without a supported destination stay in the notification sheet; no invented deep links. |
| Live connection | Existing notification socket state | Disconnected pose means live notification delivery is unavailable; the normal minute-based fallback polling continues. It does not mean a save failed or the whole server is offline. |
| Focus | Main window focus and local quiet toggle | Sit quietly while the user works; quiet mode and reduced motion suppress movement. |

These first integrations reuse the shared notification hook, not extra domain polling. No approval counts, stock urgency thresholds, production deadlines, or task completions are inferred. Further useful candidates are permission-aware approval queue summaries and confirmed long-task completion; add them only with explicit domain events, freshness/error states, and tests. Unsaved-work recovery belongs in the existing navigation guard; companion gestures must not dismiss it.

## Boundaries and lifecycle

Dodo reference: `dodo-workspace-desktop/apps/desktop/src/main/companion-{window,options,placement}.ts` and its module-companion renderer. ORYX adapts the transparent sandboxed window, silhouette hit testing, native drag, and summary IPC patterns; it does not copy messaging, reply, calling, flying, or mutation capabilities.

The isolated companion session loads packaged local assets only, with a dedicated preload and restrictive CSP. It receives only signed-in user unread alert messages and notification IDs; it cannot access session tokens, APIs, records, or attachments. Hosted summary IPC accepts only the configured server's top-level main window. Pet actions accept only the local companion's top frame and webContents. Navigation, webviews, new windows, and permissions are denied. No ERP writes occur; existing backend authorization, audit headers, approval gates, and mark-as-read behavior remain authoritative.

The companion summary contains `{ unread, connected, signedIn, alerts }`, with one bounded label/message/ID/priority record per unread notification. Its alert panel expands to 200 DIP, scrolls to the newest notification as alerts arrive, and keeps older alerts scrollable. Clicking a shipment alert opens its shipment details through the trusted main window. A separate bounded native-notification action can show title/body through Electron. Main derives focus and quiet state. Navigation, logout, and unmount clear summary state. Clicking restores the main window and opens its existing notification sheet. Closing the main window with an available tray hides it and keeps notifications/companion running. Explicit Quit disposes windows, tray, native alerts, and IPC handlers; without a tray, close follows the existing shutdown path. Browsers/older shells remain supported through an optional bridge.

## Artwork and animation

The user-supplied concept board is the character reference. `apps/desktop/src/companion/renderer/oryx-atlas.webp` is a 1024 × 1024 alpha atlas of sixteen 256px cells. Generated with the built-in ImageGen tool, then resized/encoded using cwebp; no runtime image service is used.

Prompt: Produce a transparent 4 × 4 ORYX atlas matching the supplied soft 2D tan/cream antelope, dark facial stripes, long horns, teal collar/medallion/backpack. Cells: neutral, blink, look left/right, tilt, happy, greeting, hop, two right-walk poses, two left-walk poses, alert, sitting focus, resting, disconnected. Full body, consistent scale, no text or background.

Animation uses these painted key poses plus procedural breathing/hop offsets, not the board's complete hand-drawn frame sequences. Walking follows user dragging; idle poses stay inside the window. Limited idle roaming is bounded to ±18 DIP inside the canvas, with no autonomous desktop-window travel. Urgency animation is not enabled without a genuine source event. Reduced motion holds still; quiet retains the unread badge. The atlas is a generated interpretation and should receive final character-art review.

## Verification

Run `bun run --filter @oryx/desktop typecheck`, focused notification Vitest tests, and `node --test tests/companion.test.ts`. Forge builds both renderer entries and both sandboxed preloads. Native acceptance must cover transparent click-through, dragging across scaled displays, unplugged monitors, hide/restart, quiet/reduced motion, connection transitions, logout, notification opening, closing, and packaged Windows/macOS behavior. A web-only preview cannot verify native window behavior.

## Backend-first follow-up

The backend audit and durable intent/channel-delivery changes are in `ERP/oryx-backend/docs/alert-reliability.md`. Gateway identity/reconnect/read-state synchronization and foreground native system alerts are documented in [notifications](notifications.md). New operational business rules and specific-record destinations remain backend contract work; they are not claimed present by this companion foundation.

## Local verification recorded

Desktop typecheck and macOS package build passed. A temporary-profile Electron smoke run confirmed a painted canvas, no Node/session bridge in the pet, click-to-open, close-to-background with tray, and clean quit. Gateway: 12 tests passed. Focused notification web tests: 12 passed. React Doctor on task changes: 100/100. Native screenshots were inspected locally. Signed Windows, customer scaling/multiple monitors, actual OS notification-center permissions and end-to-end broker outages remain acceptance gates.

## Frontend controls and alert selection (2026-10-24)

Settings → Appearance now includes ORYX Companion controls for visibility, quiet movement, limited roaming, and resetting position. Controls are native device commands, with loading, unavailable-shell, save-failure, and retry states. Preferences are stored in `companion-preferences.json` under Electron userData with mode 0600. Writes are serialized so quick changes cannot overwrite each other. Existing visibility/position files are read for compatibility; notification content and session data are not persisted in preferences. Quiet/roaming choices apply through both Settings and the companion context menu.

Shared native/web contracts live in `shared/companion.ts`; the desktop contract module reexports them. The configured app main frame alone can call `companion:settings` and `companion:command`. Commands use a validated numeric enum. Browser/older-shell clients show an explanation instead of broken controls.

Clicking an OS alert forwards its notification ID into the hosted notification sheet. The matching entry is focused and highlighted. Clicking a companion alert opens shipment details when the current unread record carries a shipment document ID; other records open the notification sheet. If it was already read, the sheet fetches existing history and selects it there. An unavailable record has an explicit history message; history failures offer Retry. Selection never marks an alert read. ERP navigation continues through the existing notification links and route guards; direct ERP-record links still require backend source metadata.

The renderer now distinguishes signed-out calm from a disconnected authenticated session, respects stillness during quiet/reduced motion, and uses actual walking poses during bounded roaming. Rest ends on interaction. If artwork fails to load, a painted Open Oryx fallback remains clickable. Accessible labels/tooltips describe connection/unread state and alert rows expose their event and message text.

Verification for this continuation: five desktop tests cover motion bounds, stillness, wake/rest behavior, preference persistence and malformed data. Seventeen focused web tests cover Settings, native failures, targeted unread/history selection and existing alert behavior. Full workspace typecheck and macOS packaging passed; isolated native tests verified origin/command rejection, hide/show, background mode and persisted preferences across restart. Settings and selected-alert rendering were inspected at desktop/narrow widths and in light/dark themes. Customer Windows scaling and OS notification behavior remain deployment acceptance checks.

## Visible alert indicators and Appearance (2026-10-24)

The character now has a persistent caption containing the notification event label, explicit priority text and total unread count, plus quiet/connection status. Quiet mode and reduced motion stop movement while retaining those indicators. The artwork stays 176 × 176 DIP; the window extends to 176 × 256 DIP for the caption and clamps the full height to the display.

Settings → Appearance → ORYX Companion includes **Show alert details**, enabled by default and saved on this device alongside visibility/quiet/roaming. Turning it off restores the 176 × 176 window; it does not disable notifications. Clicking the companion opens the notification represented by its label.

The companion consumes the signed-in user's backend in-app notification feed. Existing Alert Configuration remains authoritative for enabled rules, event selection, recipients and channels. The event labels are shared with the Alert Configuration editor through `shared/notifications/event-catalog.ts`; there is no second companion rule engine, no administrative configuration fetch, and no role-name inference.

The current backend Alert/Notification DTOs have no priority field and do not include the custom configuration title. Accordingly, existing alerts show the shared event label and **Priority not set**. A future backend-provided named `priority` (Low/Medium/High/Critical, case-insensitive) is retained through gateway/list parsing and displayed explicitly. Numeric values are not guessed without a contract. Missing/unknown priority is never inferred from event type, message wording, or configuration TimeFrame. Actual configured priority/title must be emitted by the backend before the frontend can display them.

Among unread notifications the highest explicitly supplied priority is displayed; backend order breaks ties. The unread total always includes all notifications. Reading the selected alert promotes another unread item; signing out clears its label/count. Only bounded event-label/priority/ID summary data enters the local companion renderer. Alert bodies and administrative configuration remain outside it.

Indicator verification: 29 focused web tests (including existing alert editor/schema regressions), 8 desktop tests, 3 summary/bounds tests, and 12 gateway tests passed. Workspace typecheck, macOS packaging and React Doctor (100/100) passed. An isolated native smoke test verified visible label/priority/count in quiet mode, a stable quiet canvas after repaint, the Appearance caption toggle/window sizes, and opening the represented notification. The caption screenshot was inspected. Documentation updated: companion, appearance, services and workflows.


## Multi-alert companion feed (2026-10-25)

The companion now receives every item in the signed-in user’s unread in-app feed, with its notification ID, event label, message and explicit priority. The alert card grows to fit the feed and caps at 200 DIP; older items remain available by scrolling, and a newly received notification returns the list to the newest item. Tapping an alert opens its matching record when the backend supplies an explicit destination ID. Shipment-arrival notifications now carry a persisted shipment document ID and navigate to that exact shipment detail page. Opening details does not mark the alert read. The main view remains the only place with session and API access.


## User alert coverage and navigation (2026-10-25)

The companion feed mirrors all unread in-app notifications addressed to the signed-in user, across notification types, and adds newly pushed notifications immediately while the server list catches up. Clicking an alert opens its mapped workspace area; shipment arrivals with a shipment reference open that shipment details page. Categories without a mapped destination remain selected in the notification sheet.
