import { useState } from "react";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTicketMoves } from "../hooks/use-ticket-moves";
import { isOverdue, moveBetween, moveLabels, statusLabels, ticketPath, ticketStatuses, type TicketMove, type TicketStatus } from "../lib/tickets";
import type { Ticket } from "../schemas/ticket-schema";
import { PriorityBadge } from "./ticket-badges";
import { TicketMoveDialog } from "./ticket-dialogs";

const edge: Record<TicketStatus, string> = { 0: "border-l-primary", 1: "border-l-sky-500", 2: "border-l-amber-500", 3: "border-l-emerald-500", 4: "border-l-muted-foreground" };

function Card({ ticket, moves, onMove }: { ticket: Ticket; moves: readonly TicketMove[]; onMove: (move: TicketMove) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id });
  return <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform) }} className={cn("space-y-2 rounded-lg border border-l-4 bg-card p-3 shadow-sm", edge[ticket.status], isDragging && "relative z-20 opacity-70")}>
    <div className="flex items-start justify-between gap-2">
      {/* Only this handle drags, so the link and the menu stay ordinary controls. */}
      <button type="button" {...attributes} {...listeners} aria-label={`Drag ${ticket.number} to another status`} className="cursor-grab touch-none text-xs font-medium text-muted-foreground active:cursor-grabbing">{ticket.number}</button>
      <div className="flex items-center gap-1"><PriorityBadge priority={ticket.priority} />
        {moves.length > 0 ? <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" size="icon-sm" variant="ghost" aria-label={`Actions for ${ticket.number}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">{moves.map((move) => <DropdownMenuItem key={move} onSelect={() => onMove(move)}>{move === "assign" && ticket.assignee ? "Reassign" : moveLabels[move]}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu> : null}</div>
    </div>
    <Link to={ticketPath("team", ticket.id)} className="block break-words text-sm font-medium hover:underline">{ticket.title}</Link>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{ticket.assignee?.name ?? "Unassigned"}</span>
      {isOverdue(ticket.dueDate, ticket.status) ? <span className="font-medium text-destructive">Overdue</span> : null}</div>
  </li>;
}

function Column({ status, tickets, children }: { status: TicketStatus; tickets: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });
  return <section aria-label={`${statusLabels[status]} tickets`} className="flex min-h-0 w-64 shrink-0 flex-col rounded-lg border bg-muted/40">
    <h2 className="flex items-center justify-between border-b px-3 py-2 text-sm font-semibold">{statusLabels[status]}<span className="rounded-full bg-background px-2 text-xs font-medium">{tickets}</span></h2>
    <ul ref={setNodeRef} className={cn("min-h-28 flex-1 space-y-2 overflow-y-auto p-2", isOver && "bg-accent/50")}>{children}
      {tickets === 0 ? <li className="py-6 text-center text-xs text-muted-foreground">No tickets</li> : null}</ul>
  </section>;
}

/**
 * Tickets by status. A card is moved by dragging its number onto another column, or from its menu; either way
 * the move is confirmed, or asks for what it needs, before anything changes.
 */
export function TicketBoard({ tickets }: { tickets: readonly Ticket[] }) {
  const { moves, block } = useTicketMoves();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [pending, setPending] = useState<{ ticketId: string; move: TicketMove } | null>(null);
  const target = pending ? tickets.find((ticket) => ticket.id === pending.ticketId) ?? null : null;
  const dropped = (event: DragEndEvent) => {
    const ticket = tickets.find((item) => item.id === String(event.active.id));
    if (!ticket || !event.over) return;
    const to = Number(String(event.over.id).replace("column-", "")) as TicketStatus;
    if (ticket.status === to) return;
    const move = moveBetween(ticket.status, to);
    if (!move) { toast.error(`A ticket cannot go from ${statusLabels[ticket.status].toLowerCase()} to ${statusLabels[to].toLowerCase()}.`); return; }
    const reason = block(move, ticket);
    if (reason) { toast.error(reason); return; }
    setPending({ ticketId: ticket.id, move });
  };
  return <DndContext sensors={sensors} onDragEnd={dropped}>
    <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">{ticketStatuses.map((status) => { const inColumn = tickets.filter((ticket) => ticket.status === status);
      return <Column key={status} status={status} tickets={inColumn.length}>{inColumn.map((ticket) => <Card key={ticket.id} ticket={ticket} moves={moves(ticket)} onMove={(move) => setPending({ ticketId: ticket.id, move })} />)}</Column>; })}</div>
    {pending && target ? <TicketMoveDialog key={`${pending.ticketId}:${pending.move}`} move={pending.move} ticket={target} onClose={() => setPending(null)} /> : null}
  </DndContext>;
}
