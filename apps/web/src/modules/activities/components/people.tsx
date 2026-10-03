import { UserAvatar } from "@/shared/auth/user-avatar";

interface Person { id: string | null; name: string; avatar: string | null }

/** A few faces and a count of the rest, with every name available to screen readers and on hover. */
export function People({ people, max = 3 }: { people: readonly Person[]; max?: number }) {
  // One person can hold several instructions on a step; show each person once.
  const unique = people.filter((person, index) => people.findIndex((other) => (other.id ?? other.name) === (person.id ?? person.name)) === index);
  if (unique.length === 0) return <span className="text-xs text-muted-foreground">No one assigned</span>;
  const names = unique.map((person) => person.name).join(", ");
  return <span className="flex items-center" title={names}>
    <span className="sr-only">{names}</span>
    <span aria-hidden="true" className="flex -space-x-2">{unique.slice(0, max).map((person) => <UserAvatar key={person.id ?? person.name} user={person} size="sm" className="ring-2 ring-card" />)}</span>
    {unique.length > max ? <span aria-hidden="true" className="ml-1 text-xs text-muted-foreground">+{unique.length - max}</span> : null}
  </span>;
}
