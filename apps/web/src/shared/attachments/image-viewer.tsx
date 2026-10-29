import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Maximize, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const minZoom = 0.05;
const maxZoom = 8;
const step = 1.25;
type Point = { x: number; y: number };
const clamp = (value: number) => Math.min(maxZoom, Math.max(minZoom, value));

function Tool({ label, shortcut, onClick, disabled, children }: { label: string; shortcut?: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <Tooltip><TooltipTrigger asChild>
    <Button type="button" size="icon-sm" variant="ghost" aria-label={label} onClick={onClick} disabled={disabled}>{children}</Button>
  </TooltipTrigger><TooltipContent>{label}{shortcut ? <span className="ml-2 text-muted-foreground">{shortcut}</span> : null}</TooltipContent></Tooltip>;
}

/** Read-only image viewing: fit, zoom about the pointer, drag to pan, pinch on touch screens, and rotate. */
export function ImageViewer({ src, name, onFailed }: { src: string; name: string; onFailed: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ distance: number; zoom: number } | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [view, setView] = useState<{ zoom: number | null; offset: Point; rotation: number }>({ zoom: null, offset: { x: 0, y: 0 }, rotation: 0 });

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setBox({ width: entry.contentRect.width, height: entry.contentRect.height }); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const turned = view.rotation % 180 !== 0;
  const fitZoom = natural && box.width && box.height
    ? Math.min(1, (box.width - 32) / (turned ? natural.height : natural.width), (box.height - 32) / (turned ? natural.width : natural.height)) : 1;
  const zoom = view.zoom ?? fitZoom;
  const fitted = view.zoom === null;

  /** Zoom keeping the point under `anchor` (relative to the stage centre) still. */
  const zoomTo = useCallback((next: number | null, anchor: Point = { x: 0, y: 0 }) => setView((current) => {
    const from = current.zoom ?? fitZoom;
    if (next === null) return { ...current, zoom: null, offset: { x: 0, y: 0 } };
    const to = clamp(next);
    const ratio = to / from;
    return { ...current, zoom: to, offset: { x: anchor.x - (anchor.x - current.offset.x) * ratio, y: anchor.y - (anchor.y - current.offset.y) * ratio } };
  }), [fitZoom]);
  const relative = (clientX: number, clientY: number): Point => {
    const rect = stage.current?.getBoundingClientRect();
    return rect ? { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 } : { x: 0, y: 0 };
  };
  const rotate = (by: number) => setView((current) => ({ ...current, rotation: (current.rotation + by + 360) % 360, zoom: null, offset: { x: 0, y: 0 } }));

  // React's wheel listener is passive, so the page would scroll as well as zoom.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const anchor = { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 };
      zoomTo(zoom * Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.0015)), anchor);
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [zoom, zoomTo]);

  const down = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      if (a && b) gesture.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()];
      if (a && b) zoomTo(gesture.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / gesture.current.distance), relative((a.x + b.x) / 2, (a.y + b.y) / 2));
      return;
    }
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    setView((current) => ({ ...current, zoom: current.zoom ?? fitZoom, offset: { x: current.offset.x + dx, y: current.offset.y + dy } }));
  };
  const up = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
  };
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const pan = (x: number, y: number) => setView((current) => ({ ...current, zoom: current.zoom ?? fitZoom, offset: { x: current.offset.x + x, y: current.offset.y + y } }));
    const actions: Record<string, () => void> = {
      "+": () => zoomTo(zoom * step), "=": () => zoomTo(zoom * step), "-": () => zoomTo(zoom / step), "0": () => zoomTo(null), "1": () => zoomTo(1),
      r: () => rotate(90), R: () => rotate(-90), ArrowLeft: () => pan(48, 0), ArrowRight: () => pan(-48, 0), ArrowUp: () => pan(0, 48), ArrowDown: () => pan(0, -48),
    };
    const action = actions[event.key];
    if (action && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); action(); }
  };

  // Shortcuts work from the toolbar buttons as well as the picture itself.
  // The viewer can open outside the app shell (tests, standalone pages), so it brings its own tooltip provider.
  return <TooltipProvider delayDuration={300}><div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border" onKeyDown={key}>
    <div role="toolbar" aria-label="Image controls" className="flex shrink-0 flex-wrap items-center gap-1 border-b bg-muted/40 px-2 py-1">
      <Tool label="Zoom out" shortcut="−" onClick={() => zoomTo(zoom / step)} disabled={zoom <= minZoom}><ZoomOut /></Tool>
      <Tooltip><TooltipTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="w-16 tabular-nums" aria-label={`Zoom ${Math.round(zoom * 100)}%. Show actual size`} onClick={() => zoomTo(1)}>{Math.round(zoom * 100)}%</Button>
      </TooltipTrigger><TooltipContent>Actual size <span className="ml-2 text-muted-foreground">1</span></TooltipContent></Tooltip>
      <Tool label="Zoom in" shortcut="+" onClick={() => zoomTo(zoom * step)} disabled={zoom >= maxZoom}><ZoomIn /></Tool>
      <Tool label="Fit to window" shortcut="0" onClick={() => zoomTo(null)} disabled={fitted}><Maximize /></Tool>
      <span aria-hidden className="mx-1 h-4 w-px bg-border" />
      <Tool label="Rotate left" shortcut="⇧R" onClick={() => rotate(-90)}><RotateCcw /></Tool>
      <Tool label="Rotate right" shortcut="R" onClick={() => rotate(90)}><RotateCw /></Tool>
      {natural ? <span className="ml-auto px-1 text-sm tabular-nums text-muted-foreground">{natural.width} × {natural.height} px</span> : null}
    </div>
    <div ref={stage} tabIndex={0} aria-label={`${name}. Drag to move, scroll or pinch to zoom.`}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onDoubleClick={(event) => zoomTo(fitted || zoom < 1 ? Math.max(1, fitZoom * 2) : null, relative(event.clientX, event.clientY))}
      className={cn("relative min-h-0 flex-1 touch-none select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        natural ? "cursor-grab active:cursor-grabbing" : "")}
      style={{ backgroundColor: "var(--muted)", backgroundImage: "conic-gradient(var(--background) 25%, transparent 0 50%, var(--background) 0 75%, transparent 0)", backgroundSize: "20px 20px" }}>
      <img src={src} alt={name} draggable={false} referrerPolicy="no-referrer" decoding="async"
        onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth || 300, height: event.currentTarget.naturalHeight || 150 })} onError={onFailed}
        className={cn("absolute top-1/2 left-1/2 max-w-none shadow-sm", natural ? "" : "invisible")}
        style={natural ? { width: natural.width, height: natural.height, transform: `translate(-50%, -50%) translate(${view.offset.x}px, ${view.offset.y}px) rotate(${view.rotation}deg) scale(${zoom})` } : undefined} />
    </div>
  </div></TooltipProvider>;
}
