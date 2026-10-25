# Notifications and system alerts

The backend is authoritative for alert rules, recipients, unread state, identity and time. The local companion and operating-system notifications are views of that state.

## Delivery path

```text
Business change → durable alert intent → configured recipients
    → persisted notification + channel outbox → RabbitMQ
    → authenticated gateway → recipient sockets → bell / system alert / companion
                             ↑ REST unread reconciliation and mark-as-read
```

The companion integration is paired with backend hardening in `ERP/oryx-backend`; see its `docs/alert-reliability.md`. The backend migration must be reviewed/applied before deploying that backend version. This repository alone does not enable missing domain rules.

## Gateway

`apps/gateway` consumes the backend's fanout exchanges using private ephemeral queues; it never competes with another application's consumer. Authentication uses the backend's authenticated-user endpoint. Notification text is routed only to the listed recipients' rooms; absent/invalid recipients are never broadcast. Read events are routed only to the affected user's room. Production-board identifiers retain their existing authenticated broadcast behavior.

| Exchange | Client event | Data |
| --- | --- | --- |
| `DOMAIN.Entities.Notifications:NotificationDto` | `notification` | Stable notification ID when present, text, type, original sent time; no recipient list. |
| `DOMAIN.Entities.Notifications:NotificationReadEvent` | `notification-read` | Notification ID; only the user's sessions. |
| ProductionActivityStepStatusChangedEvent | `activity-updated` | Existing production identifiers. |

The gateway publishes `delivery-state` to authenticated sessions on broker loss/recovery and initial connection. A live socket is not evidence that the broker is healthy. `/realtime/health` remains 503 when the broker is unavailable. Channel failure/cancellation closes and reconnects the broker connection. Tokens are periodically rechecked; rejected sessions disconnect. Allowed browser origins must be explicit.

Queues are not a replay store. The backend unread API is the durable recovery path. On socket reconnect, broker recovery, or read events, the web hook refetches unread notifications immediately. Polling remains every minute without live delivery and every five minutes with it, plus focus/network recovery. Events can repeat; stable IDs deduplicate them. Legacy events without IDs retain text-based fallback deduplication. Two new notifications with different IDs and the same text are separate alerts.

## Visible in every working mode

- A new arrival shows an in-app toast and a system notification, including while Oryx is in the foreground.
- Installed Electron clients use a narrow native notification bridge. `timeoutType: never` requests extended visibility; browsers with granted permission request `requireInteraction`.
- The operating system controls notification-center retention, permission, focus/DND suppression, and dismissal. Oryx cannot force a toast to stay indefinitely. The backend unread list and companion badge remain until the user marks the alert read.
- On sign-in/restart, one native summary points to waiting unread alerts. Individual old alerts are not replayed as a toast flood.
- Clicking a system notification restores Oryx and opens the notification sheet. Clicking or dismissing an OS alert never marks it read.
- Mark-as-read retains backend recipient authorization. Its persisted targeted event refreshes other connected sessions. Browser polling supports older backend versions that do not emit that event.
- Companion stays always on top and can continue while the main window is hidden. Closing the main window with a working tray keeps the app running; Open Oryx and Quit are available from the tray. Explicit Quit exits cleanly.
- The companion shows every unread alert in a 200 DIP scrolling panel and jumps to the newest alert when a new ID arrives. Clicking an alert does not mark it read.
- Limited roaming stays within the companion canvas, stops during focus/interaction/unread alerts, and respects quiet/reduced-motion preferences.

System alerts validate sender/frame/origin and bounded title/body fields. The local companion renderer receives the signed-in user’s unread alert labels, messages, IDs and priorities. It has no session, API access or ERP mutation capabilities. Alert rows are individually clickable; shipment rows with a persisted shipment ID open that shipment’s details through the trusted main window. Navigation/sign-out clears local native notification state to prevent another session opening stale private alerts.

## ERP links and coverage

Existing notification type links point to module/queue pages. The current backend DTO does not identify a specific ERP record. Direct record opening requires backend-owned record type/ID, event code, priority, and permission-aware routing; do not infer an ID from text. Requested OOS, upcoming expiry, reorder, blocked production, requisition approval, delayed PO/receipt, discrepancy, COA/ARD/worksheet review and calibration alerts require real backend rules. See the backend coverage audit and [companion usage](companion.md). No new business priority or due threshold is invented by the companion.

## Running and deploying

Use `bun run dev:gateway`. Configure `ORYX_API_ORIGIN`, `ORYX_GATEWAY_ALLOWED_ORIGINS`, and `RABBITMQ_HOST`/`RABBITMQ_DEFAULT_USER`/`RABBITMQ_DEFAULT_PASS` or `RABBITMQ_URL`. Host/port default to `127.0.0.1:4100`. The customer reverse proxy serves `/realtime` with WebSocket upgrades. Development uses `ORYX_DEV_GATEWAY_ORIGIN`. Existing HTTPS and explicit intranet HTTP controls remain in force.

Backend API paths remain `GET /api/v1/alert/notifications?unreadOnly=true` and `PUT /api/v1/alert/{id}/mark-as-read`. Email is a separate backend channel. Earlier history is loaded only on request. Read failures restore optimistic UI and report failure; mark-all stops at the first refusal.

## Verification and limits

Gateway tests exercise real sockets for recipient isolation, authentication, token rejection, broker state and targeted read refresh. Web tests cover unread recovery, replay deduplication, read rollback, browser/older-shell support, and native/fallback system-alert paths. Desktop checks cover bounds, summary validation, packaged renderer inclusion, and native canvas isolation/background lifecycle.

Live PostgreSQL/RabbitMQ failure injection, customer Windows/scaling/multiple-display behavior, native OS notification settings, and signed installer acceptance are deployment gates, not claims made by local tests.

Backend verification also includes 22 alert tests, one using a disposable PostgreSQL instance to apply the migration and verify failed-delivery recovery/concurrent claim fencing. No customer database migration or production deployment was performed.

## Local connection diagnosis and device test (2026-10-24)

The desktop saved server is `http://127.0.0.1:5173`; local `/api` is proxied to `http://164.90.142.68:8086`. The missing realtime proxy, absent local gateway listener, and malformed `RABBITMQ_HOST=http://...` prevented live updates. Local ignored configuration now points `ORYX_DEV_GATEWAY_ORIGIN` at `http://127.0.0.1:4100`, sets the gateway HTTP port explicitly to 4100, allows the exact frontend origin, and uses a plain broker hostname. Existing credentials were retained and never printed. Explicit existing-development HTTP opt-in is needed for the configured backend; certificates/security checks were not bypassed. Gateway configuration now rejects HTTP-style broker host strings with an actionable error.

Verified `/realtime/health` through the frontend reports `status: ok` and one client; the running authenticated UI displays “New notifications appear here as they are sent.” The gateway was started with `bun run dev:gateway` and must stay running for local realtime delivery. This does not install a persistent OS service.

Appearance → ORYX Companion → **Send test notification** submits a clearly labelled device-only notification through the existing native bridge. It does not create a backend alert, change counts, or prove domain rule/broker delivery. The running app accepted one test during this session. OS banners/history remain subject to permissions and DND; acceptance by the native API is not proof that the user saw a banner. Real business-event coverage needs a separate authorized backend test.

Device-test verification: five Appearance tests and 12 gateway tests passed, including the malformed-host guard; React Doctor reports 100/100 on changed UI code. The live authenticated app confirmed realtime connection and accepted the native device test. No synthetic broker business event or ERP write was performed. Documentation updated: notifications, appearance, services and workflows.


## Companion alert feed (2026-10-25)

Every unread notification is included in the companion feed and updated through the same realtime and REST reconciliation path as the notification sheet. Its card grows up to 200 DIP, then scrolls internally; a newly received ID scrolls the feed to the newest entry. Each alert is individually actionable. Shipment arrivals include an explicit persisted shipment document ID, and the trusted main window resolves the notification before navigating to that shipment’s detail page. Opening details does not mark the alert read.


## Companion alert routing (2026-10-25)

The companion receives the user's complete unread notification list and live notifications, not a shipment-only subset. Alert type is carried through the companion bridge so clicks can open the matching workspace route; shipment arrivals include their document reference for direct details navigation.
