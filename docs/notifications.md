# Notifications

How a notification gets from the backend to the right person's screen, and what the app does when it arrives.

## The path

```text
.NET backend ──publishes──▶ RabbitMQ fan-out exchange ──▶ notification gateway (apps/gateway)
                                                              │  authenticated Socket.IO, /realtime
                                                              ▼
                                                     desktop app (bell, toast, system notification)
.NET backend ◀──────────── unread list, mark as read (REST) ──┘
```

- The backend publishes each in-app notification to the fan-out exchange `DOMAIN.Entities.Notifications:NotificationDto`, and saves it so it appears in the user's unread list.
- The **gateway** binds a queue of its own to that exchange and passes each notification on, over Socket.IO, to the people it is addressed to.
- The **app** shows it at once, and reads the unread list from the backend so the bell always agrees with the server.

The backend is unchanged. `oryx-next` keeps working beside this: its server has its own queue on the same exchange, and a fan-out exchange gives every queue every message, so neither takes messages from the other.

## The gateway (`apps/gateway`)

A small Node service. It holds no data and makes no decisions about who a user is.

| Concern | How |
| --- | --- |
| Who is connecting | The client sends its access token in the Socket.IO handshake (`auth`, never the address). The gateway asks the backend (`GET /api/v1/user/authenticated`) whose it is. No valid token, no connection. A disabled account is refused. |
| Who receives what | Each socket joins a room for its user id. A notification is emitted only to the rooms of its recipients. One with no readable recipient is dropped, never broadcast. |
| What is sent | The text, the type and the time. The recipient list and the recipients' details stay on the server. |
| Staying valid | Every five minutes the gateway checks each connected token again and disconnects one the backend no longer accepts. |
| Browser origins | Only the origins listed in `ORYX_GATEWAY_ALLOWED_ORIGINS`; `*` is refused at start-up. |
| Broker outages | Reconnects with a growing wait. `/realtime/health` answers 503 while the broker is unreachable. |
| Secrets | Broker credentials and tokens are never logged. Tokens are remembered for a minute as a hash only. |

Its queues are exclusive and temporary. Nothing builds up while the gateway is down, and nothing is lost for good either: the unread list is in the backend, and every client reads it when it connects and on a timer.

Production-run updates (`ProductionActivityStepStatusChangedEvent`) go the same way, as `activity-updated`, to every signed-in client. They carry identifiers only; the app re-reads the run from the backend.

### Running it

```bash
cp apps/gateway/.env.example apps/gateway/.env   # then fill it in
bun run dev:gateway
```

| Variable | Meaning |
| --- | --- |
| `ORYX_API_ORIGIN` | The backend. HTTPS, unless it is local or `ORYX_GATEWAY_ALLOW_INSECURE=1` is set knowingly. |
| `ORYX_GATEWAY_ALLOWED_ORIGINS` | Comma-separated origins the app is served from. |
| `RABBITMQ_HOST`, `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS` | The broker, with the same names `oryx-next` uses. Or `RABBITMQ_URL`. |
| `ORYX_GATEWAY_HOST`, `ORYX_GATEWAY_PORT` | Where it listens. Default `127.0.0.1:4100`. |

In production the customer server's HTTPS entry point passes `/realtime` through to the gateway, with WebSocket upgrade, so the app reaches it on its own origin. In development set `ORYX_DEV_GATEWAY_ORIGIN` in `apps/web/.env` and Vite proxies `/realtime`.

## In the app

`shared/notifications`, shown by the bell in the header (`components/shell/notification-sheet.tsx`).

- **The unread list is the truth.** The bell's count and list come from `GET /api/v1/alert/notifications?unreadOnly=true`, which the backend filters to the signed-in user.
- **A push is announced at once.** A message inside the app says what it is, with a View button. If the window is in the background and the user has allowed it, the operating system shows it too. Permission is only asked for from a button in the notification list.
- **Then the list is read again**, a moment later and once more. The backend publishes a notification just before it saves it, so the push can arrive before the list has it.
- **Nothing is announced twice.** A notification that was pushed and then turns up in the list is recognised by its text.
- **Signing in does not replay the backlog.** What was already waiting shows in the count; only what arrives afterwards is announced. More than three at once are announced as one line.
- **Without the gateway it still works.** The list is read every minute (every five with the live connection up, in case a push was missed), when the window regains focus, and when the network comes back. Whatever is new is announced the same way. The notification list says which mode it is in.
- **Mark as read** removes the item at once and puts it back if the server refuses. **Mark all** sends the requests one after another and stops at the first refusal, saying how many were done.
- **Earlier notifications** are loaded only when asked for.
- Where a notification is about something the app has a page for, it links to it.

## Changed from oryx-next, and why

| oryx-next | Now | Why |
| --- | --- | --- |
| Every notification was sent to every connected browser, and each showed it as a toast. | Sent only to its recipients. | People saw notifications that were not theirs, with their text. |
| Anyone could open the socket; no sign-in was checked. | The backend vouches for each connection, and keeps vouching while it is open. | The socket carried business information. |
| A toast was shown, but the bell did not change until the page was reloaded. | The unread list is read again on every push. | The count was wrong until a reload. |
| If the socket was down, nothing arrived. | The list is checked on a timer and on return to the window. | Notifications should not depend on one connection. |
| "Mark all as read" sent every request at once and ignored failures. | One after another, stopping and reporting at the first failure. | Half-done work should be visible. |
| The app's own server consumed a shared queue. | The gateway uses a queue of its own. | Two consumers on one queue each get only some of the messages. |

## Known limits (server behaviour)

- The notification list does not say when each was sent: the backend fills that field with the time of the request. The app shows a time only for notifications it received during the session.
- There is no "mark all as read" on the server, so it is one request per notification.
- The id in a pushed notification is not the id it is saved under, so a push cannot be marked as read until the list has been read.
- Email notifications are sent by the backend and do not pass through here.

## Tests

- `apps/gateway/src/gateway.test.ts`: reading published messages, routing to recipients only, the token check and its caching, configuration that refuses unsafe settings.
- `apps/gateway/src/server.test.ts`: over real sockets — a notification reaches every session of its recipient and nobody else, an unauthenticated client is not connected, a client whose token stops being accepted is disconnected.
- `apps/web/src/shared/notifications/notifications.test.tsx`: the backlog is not announced, a push is announced once and the bell follows the server, a later check announces what it finds, mark as read with a refusal, mark all in order.
