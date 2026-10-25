import type { CompanionView } from "../contract";
import { indicatorText } from "./indicators";
import { Clip, clips } from "./animation";
export function baseline(view: CompanionView): Clip {
  if (!view.signedIn) return Clip.Idle;
  if (!view.connected) return Clip.Offline;
  return view.quiet || view.focused ? Clip.Focus : Clip.Idle;
}
export function companionDescription(view: CompanionView): string {
  if (!view.signedIn) return "ORYX Companion. Sign in to view alerts.";
  const indicators = indicatorText(view);
  const count = view.unread === 1 ? "1 unread alert" : `${view.unread} unread alerts`;
  const alert = view.alerts?.[0];
  const label = alert ? `${alert.label}: ${alert.message}` : "All caught up";
  return `ORYX Companion. ${label}. ${indicators.priority}. ${count}. ${view.connected ? "Live updates connected." : "Live updates disconnected; Oryx checks periodically."} Click an alert to open its details. Drag to move. Right-click for controls.`;
}
export function presentation(view: CompanionView, clip: Clip, now: number, began: number, lastActivity: number, interacting: boolean, dragging: boolean, reduced: boolean) {
  const still = reduced || view.quiet;
  const phase = now % 30000;
  const mayRoam = view.roaming && view.signedIn && view.connected && !view.focused && !view.unread && !still && !interacting && !dragging;
  const walking = mayRoam && phase > 20000;
  const direction = phase < 22500 || phase > 27500 ? Clip.WalkRight : Clip.WalkLeft;
  const active = still ? baseline(view) : walking ? direction : clip;
  const sequence = clips[active];
  const progress = still ? 0 : ((now - began) / 1000 % sequence.seconds) / sequence.seconds;
  const resting = !still && !walking && !interacting && !dragging && active === Clip.Idle && !view.unread && now - lastActivity >= 120000;
  return {
    frame: resting ? 14 : sequence.frames[Math.min(sequence.frames.length - 1, Math.floor(progress * sequence.frames.length))] ?? 0,
    x: walking ? Math.sin((phase - 20000) / 10000 * Math.PI * 2) * 18 : 0,
    y: still ? 0 : Math.sin(now / 510) * .6 - (active === Clip.HappyHop ? Math.sin(progress * Math.PI) * 9 : 0),
  };
}
