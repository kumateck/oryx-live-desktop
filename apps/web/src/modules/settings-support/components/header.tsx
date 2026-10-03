import type { ReactNode } from "react";

export function SettingsHeader({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <header className="flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0"><p className="eyebrow">SETTINGS</p><h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p></div>{children}
  </header>;
}
