import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { useNavigation } from "../../../modules/navigation/use-navigation";

/** Shown for sidebar destinations whose screens have not been moved from Oryx Next yet. */
export default function PendingPage() {
  const { pathname } = useLocation();
  const { groups, active } = useNavigation();
  const group = groups.find((item) => item.id === active?.groupId);
  return <section className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
    <p className="eyebrow">{group ? group.label.toUpperCase() : "NOT FOUND"}</p>
    <h1 className="text-xl font-semibold">{active ? "This screen is not in the desktop app yet" : "Page not found"}</h1>
    <p className="break-all text-sm text-muted-foreground">{active
      ? "It is still available in the Oryx web application while it is being moved."
      : `Nothing is available at ${pathname}.`}</p>
    <Button asChild size="sm" variant="outline"><Link to="/home">Home</Link></Button>
  </section>;
}
