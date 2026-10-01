const events = new EventTarget();
const expiredEvent = "oryx-session-expired";

export function notifySessionExpired(): void {
  events.dispatchEvent(new Event(expiredEvent));
}

export function onSessionExpired(listener: () => void): () => void {
  events.addEventListener(expiredEvent, listener);
  return () => events.removeEventListener(expiredEvent, listener);
}
