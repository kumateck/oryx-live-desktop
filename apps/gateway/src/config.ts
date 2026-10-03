/** Where the gateway listens, which backend vouches for a client, and which broker it reads. All from the environment. */
export interface GatewayConfig {
  port: number;
  host: string;
  /** The .NET backend. A client's token is checked against it; the gateway holds no user data of its own. */
  apiOrigin: string;
  /** Origins a browser page may connect from. The installed app is served from the customer server's own origin. */
  allowedOrigins: readonly string[];
  /** The broker address, with its credentials. Never logged. */
  brokerUrl: string;
  socketPath: string;
}

type Env = Readonly<Record<string, string | undefined>>;

function origin(value: string, name: string, env: Env): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`${name} must be a complete address, such as https://erp.example.com`); }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  // Tokens travel to the backend and from clients; neither should cross a network unencrypted.
  if (url.protocol !== "https:" && !local && env.ORYX_GATEWAY_ALLOW_INSECURE !== "1") throw new Error(`${name} must use HTTPS. Set ORYX_GATEWAY_ALLOW_INSECURE=1 to use plain HTTP knowingly.`);
  return url.origin;
}

/** Reads the configuration, refusing to start half-configured. The broker variables are the ones the oryx-next server already uses. */
export function readConfig(env: Env): GatewayConfig {
  const need = (name: string): string => { const value = env[name]?.trim(); if (!value) throw new Error(`${name} is not set`); return value; };
  // SOCKET_PORT is the name the oryx-next server uses; it is honoured so one set of variables serves both.
  const port = Number(env.ORYX_GATEWAY_PORT ?? env.SOCKET_PORT ?? "4100");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("ORYX_GATEWAY_PORT (or SOCKET_PORT) must be a port number");
  const allowedOrigins = need("ORYX_GATEWAY_ALLOWED_ORIGINS").split(",").map((value) => value.trim()).filter(Boolean).map((value) => {
    if (value === "*") throw new Error("ORYX_GATEWAY_ALLOWED_ORIGINS must list the origins; it cannot be *");
    return origin(value, "ORYX_GATEWAY_ALLOWED_ORIGINS", env);
  });
  const brokerUrl = env.RABBITMQ_URL?.trim()
    || `amqp://${encodeURIComponent(need("RABBITMQ_DEFAULT_USER"))}:${encodeURIComponent(need("RABBITMQ_DEFAULT_PASS"))}@${need("RABBITMQ_HOST")}`;
  return { port, host: env.ORYX_GATEWAY_HOST?.trim() || "127.0.0.1", apiOrigin: origin(need("ORYX_API_ORIGIN"), "ORYX_API_ORIGIN", env), allowedOrigins, brokerUrl, socketPath: "/realtime/socket.io" };
}
