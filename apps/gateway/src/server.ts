import { createServer, type Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { Verified } from "./auth.ts";
import { everyoneRoom, userRoom, type BoardUpdate, type ReadUpdate, type RoutedNotification } from "./messages.ts";

export interface Gateway {
  http: HttpServer;
  /** Sends a notification to the people it is addressed to, and to nobody else. */
  deliver: (notification: RoutedNotification) => void;
  /** Tells every signed-in client that a production run changed. */
  announce: (update: BoardUpdate) => void;
  read: (update: ReadUpdate) => void;
  availability: (connected: boolean) => void;
  close: () => Promise<void>;
}

/**
 * The real-time endpoint clients connect to. Nobody is connected until the backend has said who they are.
 * The token comes in the handshake's auth payload, never in the address, so it is not written to access logs.
 */
export function createGateway({ verify, allowedOrigins, socketPath, healthy, recheckMs = 5 * 60_000 }: {
  verify: (token: unknown) => Promise<Verified>; allowedOrigins: readonly string[]; socketPath: string; healthy: () => boolean;
  /** How often a connected client's token is checked again, so a signed-out or disabled user stops receiving. */
  recheckMs?: number;
}): Gateway {
  const http = createServer((request, response) => {
    if (request.url === "/realtime/health") {
      const ok = healthy();
      response.writeHead(ok ? 200 : 503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify({ status: ok ? "ok" : "broker-unreachable", clients: io.engine.clientsCount }));
      return;
    }
    response.writeHead(404).end();
  });
  const io = new Server(http, {
    path: socketPath,
    cors: { origin: [...allowedOrigins], methods: ["GET", "POST"] },
    // Clients only listen; nothing they send needs room.
    maxHttpBufferSize: 16 * 1024,
    serveClient: false,
  });

  io.use((socket, next) => {
    void verify((socket.handshake.auth as { token?: unknown } | undefined)?.token).then((result) => {
      if (!result.ok) { next(new Error(result.reason === "rejected" ? "unauthorized" : "unavailable")); return; }
      socket.data.userId = result.userId;
      next();
    });
  });

  io.on("connection", (socket) => {
    void socket.join([userRoom(socket.data.userId as string), everyoneRoom]);
    socket.emit("delivery-state", { connected: healthy() });
    const token = (socket.handshake.auth as { token?: unknown }).token;
    const recheck = setInterval(() => {
      void verify(token).then((result) => { if (!result.ok && result.reason === "rejected") socket.disconnect(true); });
    }, recheckMs);
    socket.on("disconnect", () => clearInterval(recheck));
  });

  return {
    http,
    deliver: (notification) => { io.to(notification.recipients.map(userRoom)).emit("notification", notification.payload); },
    announce: (update) => { io.to(everyoneRoom).emit("activity-updated", update); },
    read: (update) => { io.to(userRoom(update.userId)).emit("notification-read", { notificationId: update.notificationId }); },
    availability: (connected) => { io.to(everyoneRoom).emit("delivery-state", { connected }); },
    close: () => new Promise((resolve) => { void io.close(() => resolve()); }),
  };
}
