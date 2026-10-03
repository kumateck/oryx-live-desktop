export const audit = { module: "IT Support", subModule: "Tickets" } as const;
export const ticketPermissions = { create: "CanCreateTicket", viewAll: "CanViewAllTickets", assign: "CanAssignTicket", close: "CanCloseTicket", comment: "CanCommentOnTicket" } as const;

/** The two places a ticket is seen from: the reporter's own list, and the IT team's board and list. */
export type TicketScope = "mine" | "team";
export const ticketRoots: Record<TicketScope, string> = { mine: "/it/my-issues", team: "/it/support-tickets" };
export const ticketPath = (scope: TicketScope, id: string) => `${ticketRoots[scope]}/${id}/details`;

/** The numbers are the server's. */
export type TicketStatus = 0 | 1 | 2 | 3 | 4;
export const ticketStatus = { open: 0, assigned: 1, inProgress: 2, done: 3, closed: 4 } as const;
export const ticketStatuses: readonly TicketStatus[] = [0, 1, 2, 3, 4];
export const statusLabels: Record<TicketStatus, string> = { 0: "Open", 1: "Assigned", 2: "In progress", 3: "Done", 4: "Closed" };
export type TicketPriority = 0 | 1 | 2 | 3;
export const priorityLabels: Record<TicketPriority, string> = { 0: "Low", 1: "Medium", 2: "High", 3: "Critical" };
export type TicketCategory = 0 | 1 | 2 | 3 | 4;
export const categoryLabels: Record<TicketCategory, string> = { 0: "Hardware", 1: "Software", 2: "Network", 3: "Account / access", 4: "Other" };
export const activityLabels: Record<number, string> = { 0: "Comment", 1: "Status change", 2: "Assignment", 3: "Reopened" };
export const optionsOf = (labels: Record<number, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

/** A ticket is overdue once its due date has passed and the work is not done. */
export function isOverdue(dueDate: string | null, status: TicketStatus, now: Date = new Date()): boolean {
  if (!dueDate || status === ticketStatus.done || status === ticketStatus.closed) return false;
  const due = new Date(dueDate);
  return !Number.isNaN(due.getTime()) && due.getTime() < now.getTime();
}

export type TicketMove = "assign" | "start" | "done" | "close" | "reopen";
export const moveLabels: Record<TicketMove, string> = { assign: "Assign", start: "Start work", done: "Mark as done", close: "Close ticket", reopen: "Reopen" };
/** What takes a ticket from one status to another. A status change with no entry here is not allowed. */
const transitions: Record<TicketStatus, Partial<Record<TicketStatus, TicketMove>>> = {
  0: { 1: "assign" }, 1: { 2: "start", 3: "done" }, 2: { 3: "done" }, 3: { 4: "close", 2: "reopen" }, 4: { 2: "reopen" },
};
export const moveBetween = (from: TicketStatus, to: TicketStatus): TicketMove | null => transitions[from][to] ?? null;

interface Actor { userId: string | null; has: (permission: string) => boolean }
interface TicketLike { status: TicketStatus; assigneeId: string | null; reporterId: string | null }
/**
 * Why this user cannot make a move on a ticket, or null when they can. Work is started and finished by the
 * person it is assigned to; assigning and closing need their own permissions; the reporter, or whoever may
 * close tickets, may reopen one.
 */
export function moveBlock(move: TicketMove, ticket: TicketLike, actor: Actor): string | null {
  const assignee = Boolean(actor.userId) && actor.userId === ticket.assigneeId;
  const reporter = Boolean(actor.userId) && actor.userId === ticket.reporterId;
  switch (move) {
    case "assign":
      if (ticket.status === ticketStatus.done || ticket.status === ticketStatus.closed) return "A finished ticket is reopened before it is assigned again.";
      return actor.has(ticketPermissions.assign) ? null : "You do not have permission to assign tickets.";
    case "start":
      if (ticket.status !== ticketStatus.assigned) return "Only an assigned ticket can be started.";
      return assignee ? null : "Only the person the ticket is assigned to can start work on it.";
    case "done":
      if (ticket.status !== ticketStatus.assigned && ticket.status !== ticketStatus.inProgress) return "Only a ticket being worked on can be marked as done.";
      return assignee ? null : "Only the person the ticket is assigned to can mark it as done.";
    case "close":
      if (ticket.status !== ticketStatus.done) return "A ticket is closed once it is done.";
      return actor.has(ticketPermissions.close) ? null : "You do not have permission to close tickets.";
    case "reopen":
      if (ticket.status !== ticketStatus.done && ticket.status !== ticketStatus.closed) return "Only a finished ticket can be reopened.";
      return reporter || actor.has(ticketPermissions.close) ? null : "Only the person who reported the ticket, or someone who may close tickets, can reopen it.";
  }
}
/** The moves this user can make on a ticket right now. */
export const availableMoves = (ticket: TicketLike, actor: Actor): TicketMove[] => (["assign", "start", "done", "close", "reopen"] as const).filter((move) => moveBlock(move, ticket, actor) === null);
