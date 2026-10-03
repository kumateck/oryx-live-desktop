import { toast } from "sonner";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePutApiV1TicketsByIdCloseMutation, usePutApiV1TicketsByIdDoneMutation, usePutApiV1TicketsByIdStartMutation } from "../api/ticket-api";
import { audit, availableMoves, moveBlock, type TicketMove } from "../lib/tickets";
import type { Ticket } from "../schemas/ticket-schema";

const done: Record<"start" | "done" | "close", string> = { start: "Work started", done: "Marked as done", close: "Ticket closed" };

/** What the signed-in user may do to a ticket, and the three moves that need nothing more than a confirmation. */
export function useTicketMoves() {
  const user = useCurrentUser();
  const { has } = useAccess();
  const actor = { userId: user?.id ?? null, has };
  const [start] = usePutApiV1TicketsByIdStartMutation();
  const [finish] = usePutApiV1TicketsByIdDoneMutation();
  const [close] = usePutApiV1TicketsByIdCloseMutation();
  /** Returns the reason it failed, or null when it worked. */
  const run = async (move: "start" | "done" | "close", ticket: Ticket): Promise<string | null> => {
    const blocked = moveBlock(move, ticket, actor);
    if (blocked) return blocked;
    const arg = { ...audit, id: ticket.id };
    const result = move === "start" ? await start(arg) : move === "done" ? await finish(arg) : await close(arg);
    if ("error" in result) return apiErrorMessage(result.error);
    toast.success(`${ticket.number}: ${done[move].toLowerCase()}`);
    return null;
  };
  return { moves: (ticket: Ticket) => availableMoves(ticket, actor), block: (move: TicketMove, ticket: Ticket) => moveBlock(move, ticket, actor), run };
}
