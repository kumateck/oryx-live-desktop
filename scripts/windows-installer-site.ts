// A disposable Windows-runner fixture. Never contacts or modifies a customer service.
import { createServer } from "node:http";
createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  const reset = new URL(request.url ?? "/", "http://127.0.0.1:3001").pathname === "/reset-password";
  response.end(`<!doctype html><html><head><meta name="application-name" content="Oryx Live"><title>${reset ? "Oryx reset smoke site" : "Oryx installer smoke site"}</title></head><body>Oryx installer connection verified on port 3001.</body></html>`);
}).listen(3001, "127.0.0.1");
