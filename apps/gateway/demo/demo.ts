// A local demonstration of live notifications, for when no RabbitMQ is at hand.
//
// It runs the real gateway server beside a stand-in for the two things it normally talks to:
//   - the backend (sign-in, the unread list, mark as read), on 127.0.0.1:4310
//   - the broker: `POST /demo/notify` does what the backend does when it raises a notification —
//     publishes it, then saves it a moment later.
// Everything listens on 127.0.0.1 only, and the account below exists only here.
//
//   node demo/demo.ts
//   ORYX_DEV_API_ORIGIN=http://127.0.0.1:4310 ORYX_DEV_GATEWAY_ORIGIN=http://127.0.0.1:4311 bunx vite --port 5183   (in apps/web)
import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createVerifier } from "../src/auth.ts";
import { createGateway } from "../src/server.ts";

const backendPort = 4310;
const gatewayPort = 4311;
const appOrigins = ["http://127.0.0.1:5183", "http://localhost:5183"];

/** Demo accounts. They work against this stand-in only. */
const accounts = [
  { id: "258da105-a506-44a9-8ff5-8d005a54f294", email: "ama@demo.test", password: "demo-ama-0001", firstName: "Ama", lastName: "Owusu" },
  { id: "358da105-a506-44a9-8ff5-8d005a54f295", email: "kofi@demo.test", password: "demo-kofi-0001", firstName: "Kofi", lastName: "Boateng" },
];
const sessions = new Map<string, string>(); // token → user id
const saved: { id: string; message: string; type: number; recipients: string[]; readBy: Set<string> }[] = [
  { id: randomUUID(), message: "Lactose (RM-002) is below its minimum stock level", type: 4, recipients: [accounts[0]!.id], readBy: new Set() },
];

const send = (response: ServerResponse, status: number, body?: unknown) => { response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(body === undefined ? "" : JSON.stringify(body)); };
const read = async (request: IncomingMessage): Promise<Record<string, unknown>> => { let text = ""; for await (const chunk of request) text += chunk; try { return JSON.parse(text || "{}") as Record<string, unknown>; } catch { return {}; } };
const signedIn = (request: IncomingMessage) => sessions.get((request.headers.authorization ?? "").replace(/^Bearer /, "")) ?? null;
const issue = (userId: string) => { const accessToken = `demo-access-${randomUUID()}`; const refreshToken = `demo-refresh-${randomUUID()}`; sessions.set(accessToken, userId); sessions.set(refreshToken, userId); return { userId, accessToken, refreshToken, expiresIn: 900 }; };

const gateway = createGateway({ verify: createVerifier({ apiOrigin: `http://127.0.0.1:${backendPort}` }), allowedOrigins: appOrigins, socketPath: "/realtime/socket.io", healthy: () => true });

const backend = createServer((request, response) => { void (async () => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const path = url.pathname;
  if (path === "/api/v1/auth/login" && request.method === "POST") {
    const body = await read(request);
    const account = accounts.find((item) => item.email === body.email && item.password === body.password);
    return account ? send(response, 200, issue(account.id)) : send(response, 400, { errors: [{ code: "Users.Details", description: "Wrong email or password." }] });
  }
  if (path === "/api/v1/auth/login-with-refresh-token" && request.method === "POST") {
    const userId = sessions.get(String((await read(request)).refreshToken ?? ""));
    return userId ? send(response, 200, issue(userId)) : send(response, 401);
  }
  // What the backend does when something happens: publish, then save a moment later.
  if (path === "/demo/notify" && request.method === "POST") {
    const body = await read(request);
    const account = accounts.find((item) => item.email === body.to) ?? accounts[0]!;
    const message = typeof body.message === "string" && body.message ? body.message : "A test notification";
    const type = typeof body.type === "number" ? body.type : 2;
    gateway.deliver({ recipients: [account.id], payload: { message, type, sentAt: new Date().toISOString() } });
    setTimeout(() => saved.unshift({ id: randomUUID(), message, type, recipients: [account.id], readBy: new Set() }), 400);
    return send(response, 202, { deliveredTo: account.email });
  }
  const userId = signedIn(request);
  if (!userId) return send(response, 401);
  const account = accounts.find((item) => item.id === userId)!;
  if (path === "/api/v1/user/authenticated") return send(response, 200, { id: account.id, firstName: account.firstName, lastName: account.lastName, email: account.email, isDisabled: false, department: { id: "558da105-a506-44a9-8ff5-8d005a54f294", name: "Warehouse", type: 1 } });
  if (path === `/api/v1/permission/user/${userId}`) return send(response, 200, [{ module: "Demo", isActive: true, children: [] }]);
  if (path === "/api/v1/alert/notifications") {
    const mine = saved.filter((item) => item.recipients.includes(userId) && (url.searchParams.get("unreadOnly") !== "true" || !item.readBy.has(userId)));
    return send(response, 200, mine.map((item) => ({ id: item.id, message: item.message, type: item.type, sentAt: new Date().toISOString() })));
  }
  const marked = /^\/api\/v1\/alert\/([^/]+)\/mark-as-read$/.exec(path);
  if (marked && request.method === "PUT") { saved.find((item) => item.id === marked[1])?.readBy.add(userId); return send(response, 204); }
  return send(response, 404, { errors: [{ code: "Demo", description: "The demonstration backend only knows sign-in and notifications." }] });
})(); });

backend.listen(backendPort, "127.0.0.1", () => console.log(`[demo] stand-in backend on http://127.0.0.1:${backendPort}`));
gateway.http.listen(gatewayPort, "127.0.0.1", () => console.log(`[demo] gateway on http://127.0.0.1:${gatewayPort}/realtime/socket.io`));
