import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { company } from "@/shared/print/company";
import { useTheme } from "@/shared/theme/theme-provider";
import sideImageUrl from "../../../../../../assets/login-side.jpg";
import wordmarkUrl from "../../../../../../assets/oryx-wordmark.svg";

/** The signed-out pages: the wordmark, a heading and the form beside the Oryx image, with a theme switch. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const theme = useTheme();
  return <main className="relative flex min-h-dvh min-w-0 items-center justify-center overflow-y-auto bg-muted/30 p-4 text-foreground sm:p-8">
    <Button type="button" variant="outline" size="icon-sm" aria-label="Toggle theme"
      className="absolute right-4 top-4 sm:right-8 sm:top-8" onClick={theme.toggle}>
      {theme.resolved === "dark" ? <Sun /> : <Moon />}
    </Button>
    <section className="grid w-full max-w-5xl overflow-hidden rounded-xl border bg-card shadow-sm md:grid-cols-2">
      <div className="flex min-w-0 flex-col justify-center p-7 sm:p-10 lg:p-14">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-4 text-center">
            <span className="mx-auto block h-10 w-28 bg-[var(--brand)] [mask-repeat:no-repeat] [mask-size:contain]"
              role="img" aria-label="Oryx" style={{ maskImage: `url("${wordmarkUrl}")` }} />
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {children}
          <p className="text-center text-xs text-muted-foreground md:hidden">{company.name}</p>
        </div>
      </div>
      <div className="relative hidden min-h-[520px] md:order-first md:block">
        <img src={sideImageUrl} alt="" decoding="async" className="absolute inset-0 size-full object-cover object-left" />
        {/* The client's card sits on the empty blue side of the photo; white in both themes so the logo reads. */}
        <figure className="absolute bottom-6 right-6 w-[min(58%,260px)] rounded-lg bg-white p-3 shadow-sm">
          <img src={company.logoUrl} alt={company.name} decoding="async" className="h-auto w-full" />
        </figure>
      </div>
    </section>
  </main>;
}
