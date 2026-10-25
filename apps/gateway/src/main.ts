import { createVerifier } from "./auth.ts";
import { startBroker } from "./broker.ts";
import { readConfig } from "./config.ts";
import { boardExchange, notificationExchange, notificationReadExchange, readNotificationRead, readBoardUpdate, readNotification } from "./messages.ts";
import { createGateway } from "./server.ts";

const log = (line: string) => console.log(`${new Date().toISOString()} ${line}`);
const config = readConfig(process.env);

const gateway = createGateway({ verify: createVerifier({ apiOrigin: config.apiOrigin }), allowedOrigins: config.allowedOrigins, socketPath: config.socketPath, healthy: () => broker.state.connected });
const broker = startBroker(config.brokerUrl, [
  { exchange: notificationExchange, onMessage: (raw) => { const notification = readNotification(raw); if (notification) gateway.deliver(notification); } },
  { exchange: notificationReadExchange, onMessage: (raw) => { const update = readNotificationRead(raw); if (update) gateway.read(update); } },
  { exchange: boardExchange, onMessage: (raw) => { const update = readBoardUpdate(raw); if (update) gateway.announce(update); } },
], log, gateway.availability);

gateway.http.listen(config.port, config.host, () => log(`[gateway] listening on ${config.host}:${config.port}${config.socketPath}`));

const shutdown = () => { log("[gateway] stopping"); void broker.stop().then(() => gateway.close()).then(() => process.exit(0)); setTimeout(() => process.exit(0), 5_000).unref(); };
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
