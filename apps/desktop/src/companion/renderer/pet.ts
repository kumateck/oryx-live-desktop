import atlasUrl from "./oryx-atlas.webp";
import { AlertPriority, CompanionMood, type CompanionView, type PetBridge } from "../contract";
import { windowSize } from "../placement";
import { baseline as baselineFor, companionDescription, presentation } from "./presentation";
import { Clip, clips, moodClip } from "./animation";

declare global { interface Window { oryxPet: PetBridge } }
/** The painted oryx: a 176 DIP drawing space scaled to the chosen size, drawn at 2x for sharp edges. */
export function startPet(): void {
  const button = document.createElement("div");
  button.id = "companion";
  const petAction = document.createElement("button");
  petAction.id = "pet-action"; petAction.type = "button"; petAction.setAttribute("aria-label", "ORYX Companion. Click to show alerts.");
  const canvas = document.createElement("canvas");
  canvas.id = "art"; canvas.setAttribute("aria-hidden", "true");
  petAction.append(canvas); button.append(petAction);
  document.body.dataset.surface = "pet";
  document.body.replaceChildren(button);
  let side = 176;
  const resize = (size: number) => {
    side = size;
    canvas.width = size * 2; canvas.height = size * 2;
    for (const node of [document.body, button, petAction, canvas]) { node.style.width = `${size}px`; node.style.height = `${size}px`; }
  };
  resize(176);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D unavailable.");
  const ctx = context;
  const control = button;
  const bridge = window.oryxPet;
  const atlas = new Image();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let view: CompanionView = { unread: 0, connected: false, signedIn: false, focused: false, quiet: false, roaming: true };
  let active = Clip.Idle;
  let began = performance.now();
  let idleAt = began + 6000;
  let idleIndex = 0;
  let dragging = false;
  let start: { x: number; y: number } | null = null;
  let over = false;
  let lastRender = 0;
  let lastMove = 0;
  let pointer = { x: -1, y: -1 };
  let lastActivity = performance.now();
  let artFailed = false;

  function play(clip: Clip): void { active = clip; began = performance.now(); }
  const baseline = () => baselineFor(view);
  bridge.onView((next) => {
    const previousIds = new Set((view.alerts ?? []).map((alert) => alert.id));
    const arrived = next.unread > view.unread || (next.unread >= view.unread && (next.alerts ?? []).some((alert) => !previousIds.has(alert.id)));
    view = next; lastActivity = performance.now();
    const size = windowSize(view.size);
    if (size !== side) { resize(size); lastRender = 0; }
    play(arrived && !view.quiet ? moodClip(CompanionMood.Alert) : baseline());
    control.title = companionDescription(view);
  });
  function hit(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= side || y >= side) return false;
    return (ctx.getImageData(Math.floor(x * 2), Math.floor(y * 2), 1, 1).data[3] ?? 0) > 40;
  }
  function hover(): void {
    const next = dragging || hit(pointer.x, pointer.y);
    if (next) lastActivity = performance.now();
    if (next !== over) { over = next; bridge.interactive(next); }
  }
  control.addEventListener("pointermove", (event) => {
    const bounds = control.getBoundingClientRect();
    pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; hover();
    if (!start || !(event.buttons & 1)) return;
    if (!dragging && Math.hypot(event.screenX - start.x, event.screenY - start.y) > 4) {
      dragging = true; control.setPointerCapture(event.pointerId); bridge.drag("start");
    }
    if (dragging) {
      const now = performance.now();
      if (now - lastMove > 100) { play(event.movementX < 0 ? Clip.WalkLeft : Clip.WalkRight); lastMove = now; }
    }
  });
  control.addEventListener("pointerleave", () => { pointer = { x: -1, y: -1 }; if (!dragging) hover(); });
  // Main reports the cursor even when macOS stops forwarding mouse movement (Oryx not the active app).
  bridge.onPointer?.((point) => {
    if (dragging || start) return;
    pointer = { x: point.x, y: point.y };
    hover();
  });
  control.addEventListener("pointerdown", (event) => {
    const bounds = control.getBoundingClientRect();
    pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    if (event.button !== 0 || !hit(pointer.x, pointer.y)) return;
    start = { x: event.screenX, y: event.screenY };
  });
  function finish(): void {
    if (dragging) { bridge.drag("end"); play(baseline()); }
    dragging = false; start = null; hover();
  }
  control.addEventListener("pointerup", finish);
  control.addEventListener("pointercancel", finish);
  control.addEventListener("lostpointercapture", finish);
  control.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const alert = target?.closest<HTMLElement>("[data-notification-id]");
    if (alert?.dataset.notificationId) { play(Clip.Greeting); bridge.open(alert.dataset.notificationId, true); }
    else if (target?.closest("#pet-action") && event.detail <= 1) { play(Clip.Greeting); bridge.panel(true); }
  });
  control.addEventListener("dblclick", () => { bridge.panel(false); bridge.open(); });
  control.addEventListener("contextmenu", (event) => { event.preventDefault(); finish(); bridge.menu(); });

  function draw(now: number): void {
    requestAnimationFrame(draw);
    if (artFailed) return;
    // At most 20 FPS, and a still frame in quiet/reduced-motion mode.
    if (!atlas.complete || !atlas.naturalWidth || now - lastRender < (reduced.matches || view.quiet ? 250 : 50)) return;
    lastRender = now;
    const elapsed = (now - began) / 1000;
    const clip = clips[active];
    if (!clip.loop && elapsed >= clip.seconds) { play(baseline()); }
    if (!dragging && !view.quiet && !reduced.matches && now >= idleAt) {
      const idles = [Clip.Blink, Clip.LookLeft, Clip.LookRight, Clip.HeadTilt, Clip.Stretch];
      play(idles[idleIndex++ % idles.length] ?? Clip.Idle); idleAt = now + 8000;
    }
    const pose = presentation(view, active, now, began, lastActivity, over, dragging, reduced.matches);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.setTransform(side / 176, 0, 0, side / 176, 0, 0);
    ctx.drawImage(atlas, (pose.frame % 4) * 256, Math.floor(pose.frame / 4) * 256, 256, 256, 48 + pose.x * 2, 64 + pose.y * 2, 256, 256);
    if (view.signedIn && view.unread > 0) {
      // A count badge with a white ring, coloured only by an explicitly supplied priority.
      const top = (view.alerts ?? []).reduce((best, item) => Math.max(best, item.priority), AlertPriority.Unspecified);
      const text = view.unread > 99 ? "99+" : String(view.unread);
      const width = Math.max(44, 18 + text.length * 13);
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(273 - width / 2 - 4, 85, width + 8, 52, 26); ctx.fill();
      ctx.fillStyle = top === AlertPriority.Critical ? "#c2332b" : top === AlertPriority.High ? "#b45309" : "#0f766e";
      ctx.beginPath(); ctx.roundRect(273 - width / 2, 89, width, 44, 22); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.font = "600 22px system-ui, -apple-system, Segoe UI, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(text, 273, 112);
    }
    ctx.restore();
    hover();
  }
  atlas.onload = () => { requestAnimationFrame(draw); bridge.ready(); };
  atlas.onerror = () => {
    artFailed = true;
    ctx.setTransform(side / 176, 0, 0, side / 176, 0, 0);
    ctx.clearRect(0, 0, 352, 352);
    ctx.fillStyle = "#1f3b4d"; ctx.beginPath(); ctx.roundRect(48, 240, 256, 64, 16); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 24px system-ui"; ctx.textAlign = "center"; ctx.fillText("Open Oryx", 176, 280);
    control.title = "ORYX artwork could not load. Click to view alerts.";
    bridge.ready();
  };
  atlas.src = atlasUrl;
}
