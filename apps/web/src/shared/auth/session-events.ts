const events = new EventTarget();
const expiredEvent = "oryx-session-expired";
const deniedEvent = "oryx-permission-denied";

export function notifyPermissionDenied(): void {
  events.dispatchEvent(new Event(deniedEvent));
}

export function onPermissionDenied(listener: () => void): () => void {
  events.addEventListener(deniedEvent, listener);
  return () => events.removeEventListener(deniedEvent, listener);
}

export function notifySessionExpired(): void {
  events.dispatchEvent(new Event(expiredEvent));
}

export function onSessionExpired(listener: () => void): () => void {
  events.addEventListener(expiredEvent, listener);
  return () => events.removeEventListener(expiredEvent, listener);
}
