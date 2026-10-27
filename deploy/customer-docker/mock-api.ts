// Disposable local/CI fixture only. Never deployed with the runtime image.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const contract = await readFile("/fixtures/backend.json");
const server = createServer((request, response) => {
  const path = request.url ?? "";
  response.setHeader("Content-Type", "application/json");
  if (path === "/swagger/v1/swagger.json") { response.end(contract); return; }
  if (path === "/api/v1/user/authenticated") { response.writeHead(401); response.end('{"detail":"fixture unauthenticated"}'); return; }
  if (path.startsWith("/api/echo")) {
    response.end(JSON.stringify({ url: path, authorization: request.headers.authorization, host: request.headers.host, proto: request.headers["x-forwarded-proto"] })); return;
  }
  if (path === "/realtime/health") { response.end('{"status":"ok"}'); return; }
  response.writeHead(404); response.end('{"detail":"fixture not found"}');
});
server.on("upgrade", (request, socket) => {
  const key = request.headers["sec-websocket-key"];
  if (!key || !request.url?.startsWith("/realtime/socket.io/")) { socket.destroy(); return; }
  const accept = createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
});
server.listen(5001, "0.0.0.0");
