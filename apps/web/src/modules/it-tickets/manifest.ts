import type { ModuleManifest } from "../contract";

const team = { kind: "some", permissions: ["CanViewAllTickets", "CanAssignTicket", "CanCloseTicket", "CanCommentOnTicket"] } as const;

export const manifest = {
  id: "it-tickets",
  label: "IT tickets",
  root: "/it",
  order: 24,
  // Anyone signed in may follow the issues they reported themselves.
  access: { kind: "authenticated" },
  routes: [
    { pattern: "/it/my-issues", access: { kind: "authenticated" } },
    { pattern: "/it/my-issues/:id/details", access: { kind: "authenticated" } },
    { pattern: "/it/support-tickets", access: team },
    { pattern: "/it/support-tickets/:id/details", access: team },
  ],
} satisfies ModuleManifest<"it-tickets", "/it">;
