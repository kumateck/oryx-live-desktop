import type { CompanionView } from "../contract";
import { alertSummary } from "./alerts";
import { Clip, clips } from "./animation";
/** The resting pose: still when quiet, the disconnected pose while live updates are down, otherwise idle. */
export function baseline(view: CompanionView): Clip {
  if (view.quiet) return Clip.Focus;
  if (view.signedIn && !view.connected) return Clip.Offline;
  return Clip.Idle;
}
export function companionDescription(view: CompanionView): string {
  if (!view.signedIn) return "ORYX Companion. Sign in to view alerts.";
  const indicators = alertSummary(view);
  const count = view.unread === 1 ? "1 unread alert" : `${view.unread} unread alerts`;
  const alert = view.alerts?.[0];
  const label = alert ? `${alert.label}: ${alert.message}` : "All caught up";
  return `ORYX Companion. ${label}. ${indicators.priority}. ${count}. ${view.connected ? "Live updates connected." : "Live updates disconnected; Oryx checks periodically."} Click to show alerts. Double-click to open Oryx. Drag to move. Right-click for controls.`;
}
/** Walking takes the second half of each 30 s cycle: one step out and back, ±18 DIP inside the window. */
const cycle = 30000, walkFrom = 15000;
/**
 * Still (quiet) and reduced motion hold one pose. Subtle blinks and looks around in place. Playful
 * (roaming) also walks, whether or not alerts are waiting, Oryx is focused or live updates are down;
 * it stops only while the pointer is over it or it is being dragged.
 */
export function presentation(view: CompanionView, clip: Clip, now: number, began: number, lastActivity: number, interacting: boolean, dragging: boolean, reduced: boolean) {
  const still = reduced || view.quiet;
  const phase = now % cycle;
  const mayRoam = view.roaming && !still && !interacting && !dragging;
  const walking = mayRoam && phase > walkFrom;
  const step = (phase - walkFrom) / (cycle - walkFrom);
  const direction = step < .25 || step > .75 ? Clip.WalkRight : Clip.WalkLeft;
  const active = still ? baseline(view) : walking ? direction : clip;
  const sequence = clips[active];
  const progress = still ? 0 : ((now - began) / 1000 % sequence.seconds) / sequence.seconds;
  // Lying down after two quiet minutes is for Subtle only; Playful keeps moving.
  const resting = !still && !view.roaming && !interacting && !dragging && active === Clip.Idle && !view.unread && now - lastActivity >= 120000;
  return {
    frame: resting ? 14 : sequence.frames[Math.min(sequence.frames.length - 1, Math.floor(progress * sequence.frames.length))] ?? 0,
    x: walking ? Math.sin(step * Math.PI * 2) * 18 : 0,
    y: still ? 0 : Math.sin(now / 510) * .6 - (active === Clip.HappyHop ? Math.sin(progress * Math.PI) * 9 : 0),
  };
}
