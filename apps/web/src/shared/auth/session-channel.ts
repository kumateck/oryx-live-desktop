export type SessionSignal = "signed-in" | "signed-out";

const channelName = "oryx-session";

function isSessionSignal(value: MessageEvent["data"]): value is SessionSignal {
  return value === "signed-in" || value === "signed-out";
}

/** Tells the other windows of this installation that the shared session cookie changed. */
export function openSessionChannel(onSignal: (signal: SessionSignal) => void) {
  if (typeof BroadcastChannel === "undefined") return { announce: (_signal: SessionSignal) => {}, close: () => {} };
  const channel = new BroadcastChannel(channelName);
  channel.onmessage = (event) => { if (isSessionSignal(event.data)) onSignal(event.data); };
  return {
    announce: (signal: SessionSignal) => { try { channel.postMessage(signal); } catch { /* channel already closed */ } },
    close: () => channel.close(),
  };
}
