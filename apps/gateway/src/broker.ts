import { connect, type ConsumeMessage } from "amqplib";

export interface Subscription { exchange: string; onMessage: (raw: Buffer) => void }
export interface BrokerState { connected: boolean }

/**
 * Listens to the backend's fan-out exchanges through queues of its own. The queues are private to this
 * process and vanish with it: live delivery is a convenience, and anything missed while the gateway is
 * down is still in the backend's unread list, which clients read when they connect. Because the queues
 * are its own, the gateway never takes a message away from another consumer of the same exchange.
 * Reconnects with a growing wait when the broker is unreachable.
 */
export function startBroker(url: string, subscriptions: readonly Subscription[], log: (line: string) => void): { state: BrokerState; stop: () => Promise<void> } {
  const state: BrokerState = { connected: false };
  let stopped = false;
  let wait = 1_000;
  let close: (() => Promise<void>) | null = null;
  let timer: NodeJS.Timeout | null = null;

  const retry = () => {
    state.connected = false;
    if (stopped || timer) return;
    timer = setTimeout(() => { timer = null; void run(); }, wait);
    wait = Math.min(wait * 2, 30_000);
  };

  async function run() {
    try {
      const connection = await connect(url);
      close = async () => { await connection.close().catch(() => undefined); };
      connection.on("error", (error: Error) => log(`[broker] connection error: ${error.message}`));
      connection.on("close", () => { if (!stopped) { log("[broker] connection closed; reconnecting"); retry(); } });
      const channel = await connection.createChannel();
      for (const subscription of subscriptions) {
        await channel.assertExchange(subscription.exchange, "fanout", { durable: true });
        const queue = await channel.assertQueue("", { exclusive: true, autoDelete: true });
        await channel.bindQueue(queue.queue, subscription.exchange, "");
        await channel.consume(queue.queue, (message: ConsumeMessage | null) => {
          if (!message) return;
          // A message this process cannot handle is not put back: nothing else reads this queue.
          try { subscription.onMessage(message.content); } catch (error) { log(`[broker] message dropped: ${error instanceof Error ? error.message : "unknown error"}`); }
        }, { noAck: true });
      }
      state.connected = true;
      wait = 1_000;
      log(`[broker] listening to ${subscriptions.length} exchanges`);
    } catch (error) {
      // The address carries the credentials, so only the reason is logged.
      log(`[broker] could not connect: ${error instanceof Error ? error.message.replace(/\/\/[^@\s]*@/g, "//***@") : "unknown error"}`);
      retry();
    }
  }
  void run();
  return { state, stop: async () => { stopped = true; if (timer) clearTimeout(timer); await close?.(); state.connected = false; } };
}
